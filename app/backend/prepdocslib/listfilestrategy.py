import base64
import hashlib
import logging
import os
import re
import tempfile
from abc import ABC
from glob import glob
from typing import IO, AsyncGenerator, Dict, List, Optional, Union
import urllib.parse
from datetime import datetime  # Import datetime for handling timestamps
from azure.core.credentials_async import AsyncTokenCredential
from azure.storage.filedatalake.aio import (
    DataLakeServiceClient,
)
from quart import current_app

logger = logging.getLogger("ingester")


class File:
    """
    Represents a file stored either locally or in a data lake storage account
    This file might contain access control information about which users or groups can access it
    """

    def __init__(self, content: IO, acls: Optional[dict[str, list]] = None, url: Optional[str] = None):
        self.content = content
        self.acls = acls or {}
        self.url = url

    def filename(self):
        return os.path.basename(self.content.name)

    def file_extension(self):
        return os.path.splitext(self.content.name)[1]

    def filename_to_id(self):
        filename_ascii = re.sub("[^0-9a-zA-Z_-]", "_", self.filename())
        filename_hash = base64.b16encode(self.filename().encode("utf-8")).decode("ascii")
        acls_hash = ""
        if self.acls:
            acls_hash = base64.b16encode(str(self.acls).encode("utf-8")).decode("ascii")
        return f"file-{filename_ascii}-{filename_hash}{acls_hash}"

    def close(self):
        if self.content:
            self.content.close()
    def extract_folder_path(self):
        """
        Extracts the folder path from the URL of the file.
        """
        if self.url:
            parsed_url = urllib.parse.urlparse(self.url)
            parsed_path = urllib.parse.unquote(parsed_url.path)
            content_index = parsed_path.find('/content/')
            if content_index != -1:
                folder_path = os.path.dirname(parsed_path[content_index + len('/content/'):])
                print(f"Extracted folder path: '{folder_path}' from URL: '{self.url}'")
                return folder_path
        print("URL not provided or incorrect; returning empty folder path.")
        return ''

class ListFileStrategy(ABC):
    """
    Abstract strategy for listing files that are located somewhere. For example, on a local computer or remotely in a storage account
    """

    async def list(self) -> AsyncGenerator[File, None]:
        if False:  # pragma: no cover - this is necessary for mypy to type check
            yield

    async def list_paths(self) -> AsyncGenerator[str, None]:
        if False:  # pragma: no cover - this is necessary for mypy to type check
            yield


class LocalListFileStrategy(ListFileStrategy):
    """
    Concrete strategy for listing files that are located in a local filesystem
    """

    def __init__(self, path_pattern: str):
        self.path_pattern = path_pattern

    async def list_paths(self) -> AsyncGenerator[str, None]:
        async for p in self._list_paths(self.path_pattern):
            yield p

    async def _list_paths(self, path_pattern: str) -> AsyncGenerator[str, None]:
        for path in glob(path_pattern):
            if os.path.isdir(path):
                async for p in self._list_paths(f"{path}/*"):
                    yield p
            else:
                # Only list files, not directories
                yield path

    async def list(self) -> AsyncGenerator[File, None]:
        async for path in self.list_paths():
            if not self.check_md5(path):
                yield File(content=open(path, mode="rb"))

    def check_md5(self, path: str) -> bool:
        # if filename ends in .md5 skip
        if path.endswith(".md5"):
            return True
        
        # if there is a file called .md5 in this directory, see if its updated
        stored_hash = None
        with open(path, "rb") as file:
            existing_hash = hashlib.md5(file.read()).hexdigest()
        hash_path = f"{path}.md5"
        if os.path.exists(hash_path):
            with open(hash_path, encoding="utf-8") as md5_f:
                stored_hash = md5_f.read()
                
        if stored_hash and stored_hash.strip() == existing_hash.strip():
            logger.info("Skipping %s, no changes detected.", path)
            return True
        
        # Write the hash
        with open(hash_path, "w", encoding="utf-8") as md5_f:
            md5_f.write(existing_hash)
            
        return False


# class ADLSGen2ListFileStrategy(ListFileStrategy):
#     """
#     Concrete strategy for listing files that are located in a data lake storage account
#     """

#     def __init__(
#         self,
#         data_lake_storage_account: str,
#         data_lake_filesystem: str,
#         data_lake_path: str,
#         credential: Union[AsyncTokenCredential, str],
#     ):
#         self.data_lake_storage_account = data_lake_storage_account
#         self.data_lake_filesystem = data_lake_filesystem
#         self.data_lake_path = data_lake_path
#         self.credential = credential

#     async def list_paths(self) -> AsyncGenerator[str, None]:
#         async with DataLakeServiceClient(
#             account_url=f"https://{self.data_lake_storage_account}.dfs.core.windows.net", credential=self.credential
#         ) as service_client, service_client.get_file_system_client(self.data_lake_filesystem) as filesystem_client:
#             print(self.data_lake_path)
#             async for path in filesystem_client.get_paths(path=self.data_lake_path, recursive=True):
#                 if path.is_directory:
#                     continue

#                 yield path.name

#     async def list(self) -> AsyncGenerator[File, None]:
#         async with DataLakeServiceClient(
#             account_url=f"https://{self.data_lake_storage_account}.dfs.core.windows.net", credential=self.credential
#         ) as service_client, service_client.get_file_system_client(self.data_lake_filesystem) as filesystem_client:
#             async for path in self.list_paths():
#                 temp_file_path = os.path.join(tempfile.gettempdir(), os.path.basename(path))
#                 try:
#                     async with filesystem_client.get_file_client(path) as file_client:
#                         with open(temp_file_path, "wb") as temp_file:
#                             downloader = await file_client.download_file()
#                             await downloader.readinto(temp_file)
#                     # Parse out user ids and group ids
#                     acls: Dict[str, List[str]] = {"oids": [], "groups": []}
#                     # https://learn.microsoft.com/python/api/azure-storage-file-datalake/azure.storage.filedatalake.datalakefileclient?view=azure-python#azure-storage-filedatalake-datalakefileclient-get-access-control
#                     # Request ACLs as GUIDs
#                     access_control = await file_client.get_access_control(upn=False)
#                     acl_list = access_control["acl"]
#                     # https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-access-control
#                     # ACL Format: user::rwx,group::r-x,other::r--,user:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:r--
#                     acl_list = acl_list.split(",")
#                     for acl in acl_list:
#                         acl_parts: list = acl.split(":")
#                         if len(acl_parts) != 3:
#                             continue
#                         if len(acl_parts[1]) == 0:
#                             continue
#                         if acl_parts[0] == "user" and "r" in acl_parts[2]:
#                             acls["oids"].append(acl_parts[1])
#                         if acl_parts[0] == "group" and "r" in acl_parts[2]:
#                             acls["groups"].append(acl_parts[1])
#                     yield File(content=open(temp_file_path, "rb"), acls=acls, url=file_client.url)
#                 except Exception as data_lake_exception:
#                     logger.error(f"\tGot an error while reading {path} -> {data_lake_exception} --> skipping file")
#                     try:
#                         os.remove(temp_file_path)
#                     except Exception as file_delete_exception:
#                         logger.error(f"\tGot an error while deleting {temp_file_path} -> {file_delete_exception}")


class ADLSGen2ListFileStrategy(ListFileStrategy):
    """
    Concrete strategy for listing files that are located in a data lake storage account
    """

    def __init__(
        self,
        data_lake_storage_account: str,
        data_lake_filesystem: str,
        data_lake_path: str,
        credential: Union[AsyncTokenCredential, str],
    ):
        self.data_lake_storage_account = data_lake_storage_account
        self.data_lake_filesystem = data_lake_filesystem
        self.data_lake_path = data_lake_path
        self.credential = credential

    async def list_paths(self) -> AsyncGenerator[str, None]:
        async with DataLakeServiceClient(
            account_url=f"https://{self.data_lake_storage_account}.dfs.core.windows.net", credential=self.credential
        ) as service_client, service_client.get_file_system_client(self.data_lake_filesystem) as filesystem_client:
            print(f"Listing paths in filesystem '{self.data_lake_filesystem}' at path '{self.data_lake_path}'")
            async for path in filesystem_client.get_paths(path=self.data_lake_path, recursive=True):
                if path.is_directory:
                    continue
                
                print(f"Found file path: {path.name}")
                yield path.name

    async def list_folders(self) -> List[str]:
        # folder_names = set()
        # folder_details = []
        folder_map: Dict[str, datetime] = {}  # Map to store folder name and its latest creation time
        try:
            current_app.logger.info("Starting to list folders")
            async with DataLakeServiceClient(
                account_url=f"https://{self.data_lake_storage_account}.dfs.core.windows.net", 
                credential=self.credential
            ) as service_client, service_client.get_file_system_client(self.data_lake_filesystem) as filesystem_client:
                
                async for path in filesystem_client.get_paths(path=self.data_lake_path, recursive=True):
                    current_app.logger.info(f"Processing path: {path.name}")
                    
                    if path.is_directory:
                        # folder_names.add(path.name.split('/')[0])  # Add root folder name only
                        folder_name = path.name.split('/')[0]  # Get root folder name only
                        # folder_details.append((folder_name, path.creation_time))
                        
                        # Update the map with the folder name and its latest creation time
                        if folder_name not in folder_map or path.creation_time > folder_map[folder_name]:
                            folder_map[folder_name] = path.creation_time
                    # else:
                    #     folder_path = path.name.split('/')[0]  # Add root folder name only
                    #     # folder_names.add(folder_path)
                    #     folder_details.append((folder_path, path.creation_time))
                    
                    # current_app.logger.info(f"Current folder names set: {folder_names}")
                    # current_app.logger.info(f"Current folder details: {folder_details}")
                    
                    # Not necessary to handle files separately as we are only interested in directories
                    current_app.logger.info(f"Current folder map: {folder_map}")
                    
            # # Sort folders by creation time
            # folder_details = sorted(set(folder_details), key=lambda x: x[1])
            
            # # Extract just the folder names in the sorted order
            # sorted_folder_names = [folder[0] for folder in folder_details]
            
            # Sort folders by creation time
            sorted_folder_names = sorted(folder_map.keys(), key=lambda x: folder_map[x])


            # current_app.logger.info(f"Successfully listed folders: {folder_names}")
            # return sorted(folder_names)
            current_app.logger.info(f"Successfully listed folders by creation time: {sorted_folder_names}")
            return sorted_folder_names

        except ValueError as ve:
            current_app.logger.error(f"ValueError in list_folders: {ve}")
            raise
        except Exception as e:
            current_app.logger.error(f"Unexpected error in list_folders: {e}")
            raise
    
    # async def list(self) -> AsyncGenerator[File, None]:
    #     async with DataLakeServiceClient(
    #         account_url=f"https://{self.data_lake_storage_account}.dfs.core.windows.net", credential=self.credential
    #     ) as service_client, service_client.get_file_system_client(self.data_lake_filesystem) as filesystem_client:
    #         async for path in self.list_paths():
    #             if not self.check_md5(path):
    #                 # yield File(content=open(path, mode="rb"))
    #                 temp_file_path = os.path.join(tempfile.gettempdir(), os.path.basename(path))
    #                 try:
    #                     async with filesystem_client.get_file_client(path) as file_client:
    #                         with open(temp_file_path, "wb") as temp_file:
    #                             downloader = await file_client.download_file()
    #                             await downloader.readinto(temp_file)
    #                     # Parse out user ids and group ids
    #                     acls: Dict[str, List[str]] = {"oids": [], "groups": []}
    #                     access_control = await file_client.get_access_control(upn=False)
    #                     acl_list = access_control["acl"]
    #                     acl_list = acl_list.split(",")
    #                     for acl in acl_list:
    #                         acl_parts: list = acl.split(":")
    #                         if len(acl_parts) != 3:
    #                             continue
    #                         if len(acl_parts[1]) == 0:
    #                             continue
    #                         if acl_parts[0] == "user" and "r" in acl_parts[2]:
    #                             acls["oids"].append(acl_parts[1])
    #                         if acl_parts[0] == "group" and "r" in acl_parts[2]:
    #                             acls["groups"].append(acl_parts[1])
    #                     yield File(content=open(temp_file_path, "rb"), acls=acls, url=file_client.url)
    #                 except Exception as data_lake_exception:
    #                     logger.error(f"Got an error while reading {path} -> {data_lake_exception} --> skipping file")
    #                     try:
    #                         os.remove(temp_file_path)
    #                     except Exception as file_delete_exception:
    #                         logger.error(f"Got an error while deleting {temp_file_path} -> {file_delete_exception}")
                        
    # # async def list(self) -> AsyncGenerator[File, None]:
    # #     async for path in self.list_paths():
    # #         if not self.check_md5(path):
    # #             yield File(content=open(path, mode="rb"))

    # def check_md5(self, path: str) -> bool:
    #     # if filename ends in .md5 skip
    #     if path.endswith(".md5"):
    #         return True
        
    #     # if there is a file called .md5 in this directory, see if its updated
    #     stored_hash = None
    #     with open(path, "rb") as file:
    #         existing_hash = hashlib.md5(file.read()).hexdigest()
    #     hash_path = f"{path}.md5"
    #     if os.path.exists(hash_path):
    #         with open(hash_path, encoding="utf-8") as md5_f:
    #             stored_hash = md5_f.read()
                
    #     if stored_hash and stored_hash.strip() == existing_hash.strip():
    #         logger.info("Skipping %s, no changes detected.", path)
    #         return True
        
    #     # Write the hash
    #     with open(hash_path, "w", encoding="utf-8") as md5_f:
    #         md5_f.write(existing_hash)
            
    #     return False
    
    async def list(self) -> AsyncGenerator[File, None]:
        async with DataLakeServiceClient(
            account_url=f"https://{self.data_lake_storage_account}.dfs.core.windows.net", credential=self.credential
        ) as service_client, service_client.get_file_system_client(self.data_lake_filesystem) as filesystem_client:
            async for path in self.list_paths():
                temp_file_path = os.path.join(tempfile.gettempdir(), os.path.basename(path))
                
                # Check for existing MD5 hash and skip if it matches
                if await self.check_md5(path, filesystem_client):
                    continue
                
                try:
                    async with filesystem_client.get_file_client(path) as file_client:
                        with open(temp_file_path, "wb") as temp_file:
                            downloader = await file_client.download_file()
                            await downloader.readinto(temp_file)
                            
                    # Compute MD5 hash for the new file and store it
                    await self.store_md5(path, filesystem_client)
                    
                    # Parse out user ids and group ids
                    acls: Dict[str, List[str]] = {"oids": [], "groups": []}
                    access_control = await file_client.get_access_control(upn=False)
                    acl_list = access_control["acl"]
                    acl_list = acl_list.split(",")
                    for acl in acl_list:
                        acl_parts: list = acl.split(":")
                        if len(acl_parts) != 3:
                            continue
                        if len(acl_parts[1]) == 0:
                            continue
                        if acl_parts[0] == "user" and "r" in acl_parts[2]:
                            acls["oids"].append(acl_parts[1])
                        if acl_parts[0] == "group" and "r" in acl_parts[2]:
                            acls["groups"].append(acl_parts[1])
                    yield File(content=open(temp_file_path, "rb"), acls=acls, url=file_client.url)
                except Exception as data_lake_exception:
                    logger.error(f"Got an error while reading {path} -> {data_lake_exception} --> skipping file")
                finally:
                    try:
                        os.remove(temp_file_path)
                    except Exception as file_delete_exception:
                        logger.error(f"Got an error while deleting {temp_file_path} -> {file_delete_exception}")
    
    
    async def check_md5(self, path: str, filesystem_client) -> bool:
        """
        Check if the MD5 hash of the file at `path` matches the stored hash.
        """
        hash_path = f"{path}.md5"
        md5_client = filesystem_client.get_file_client(hash_path)
    
        # Skip if the file itself is an MD5 file
        if path.endswith(".md5"):
            return True
    
        # Download the file content to compute its MD5 hash
        async with filesystem_client.get_file_client(path) as file_client:
            try:
                downloader = await file_client.download_file()
                content = await downloader.readall()
                existing_hash = hashlib.md5(content).hexdigest()
            except Exception as e:
                logger.error(f"Error downloading file for hash calculation: {e}")
                return False
    
        # Check if the MD5 hash file exists
        try:
            md5_downloader = await md5_client.download_file()
            stored_hash = (await md5_downloader.readall()).decode('utf-8').strip()
        except Exception:
            stored_hash = None
    
        # Compare existing and stored hash
        if stored_hash and stored_hash == existing_hash:
            logger.info(f"Skipping {path}, no changes detected.")
            return True
    
        return False
    
    
    async def store_md5(self, path: str, filesystem_client):
        """
        Compute the MD5 hash of the file at `path` and store it in a .md5 file in the data lake.
        """
        hash_path = f"{path}.md5"
        md5_client = filesystem_client.get_file_client(hash_path)
    
        # Compute the MD5 hash
        async with filesystem_client.get_file_client(path) as file_client:
            try:
                downloader = await file_client.download_file()
                content = await downloader.readall()
                existing_hash = hashlib.md5(content).hexdigest()
            except Exception as e:
                logger.error(f"Error downloading file for hash storage: {e}")
                return
    
        # Store the MD5 hash
        try:
            await md5_client.upload_data(existing_hash, overwrite=True)
            logger.info(f"MD5 hash stored for {path}")
        except Exception as e:
            logger.error(f"Error storing MD5 hash for {path}: {e}")