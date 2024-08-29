# import asyncio
# import logging
# import os
# from typing import List, Optional

# from azure.search.documents.indexes.models import (
#     HnswAlgorithmConfiguration,
#     HnswParameters,
#     SearchableField,
#     SearchField,
#     SearchFieldDataType,
#     SearchIndex,
#     SemanticConfiguration,
#     SemanticField,
#     SemanticPrioritizedFields,
#     SemanticSearch,
#     SimpleField,
#     VectorSearch,
#     VectorSearchProfile,
#     VectorSearchVectorizer,
# )

# from .blobmanager import BlobManager
# from .embeddings import OpenAIEmbeddings
# from .listfilestrategy import File
# from .strategy import SearchInfo
# from .textsplitter import SplitPage

# logger = logging.getLogger("ingester")


# class Section:
#     """
#     A section of a page that is stored in a search service. These sections are used as context by Azure OpenAI service
#     """

#     def __init__(self, split_page: SplitPage, content: File, category: Optional[str] = None):
#         self.split_page = split_page
#         self.content = content
#         self.category = category


# class SearchManager:
#     """
#     Class to manage a search service. It can create indexes, and update or remove sections stored in these indexes
#     To learn more, please visit https://learn.microsoft.com/azure/search/search-what-is-azure-search
#     """

#     def __init__(
#         self,
#         search_info: SearchInfo,
#         search_analyzer_name: Optional[str] = None,
#         use_acls: bool = False,
#         use_int_vectorization: bool = False,
#         embeddings: Optional[OpenAIEmbeddings] = None,
#         search_images: bool = False,
#     ):
#         self.search_info = search_info
#         self.search_analyzer_name = search_analyzer_name
#         self.use_acls = use_acls
#         self.use_int_vectorization = use_int_vectorization
#         self.embeddings = embeddings
#         # Integrated vectorization uses the ada-002 model with 1536 dimensions
#         self.embedding_dimensions = self.embeddings.open_ai_dimensions if self.embeddings else 1536
#         self.search_images = search_images

#     async def create_index(self, vectorizers: Optional[List[VectorSearchVectorizer]] = None):
#         # logger.info("Ensuring search index %s exists", self.search_info.index_name)

#         async with self.search_info.create_search_index_client() as search_index_client:
#             fields = [
#                 (
#                     SimpleField(name="id", type="Edm.String", key=True)
#                     if not self.use_int_vectorization
#                     else SearchField(
#                         name="id",
#                         type="Edm.String",
#                         key=True,
#                         sortable=True,
#                         filterable=True,
#                         facetable=True,
#                         analyzer_name="keyword",
#                     )
#                 ),
#                 SearchableField(
#                     name="content",
#                     type="Edm.String",
#                     analyzer_name=self.search_analyzer_name,
#                 ),
#                 SearchField(
#                     name="embedding",
#                     type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
#                     hidden=False,
#                     searchable=True,
#                     filterable=False,
#                     sortable=False,
#                     facetable=False,
#                     vector_search_dimensions=self.embedding_dimensions,
#                     vector_search_profile_name="embedding_config",
#                 ),
#                 SimpleField(name="category", type="Edm.String", filterable=True, facetable=True),
#                 SimpleField(
#                     name="sourcepage",
#                     type="Edm.String",
#                     filterable=True,
#                     facetable=True,
#                 ),
#                 SimpleField(
#                     name="sourcefile",
#                     type="Edm.String",
#                     filterable=True,
#                     facetable=True,
#                 ),
#                 SimpleField(
#                     name="storageUrl",
#                     type="Edm.String",
#                     filterable=True,
#                     facetable=False,
#                 ),
#             ]
#             if self.use_acls:
#                 fields.append(
#                     SimpleField(
#                         name="oids",
#                         type=SearchFieldDataType.Collection(SearchFieldDataType.String),
#                         filterable=True,
#                     )
#                 )
#                 fields.append(
#                     SimpleField(
#                         name="groups",
#                         type=SearchFieldDataType.Collection(SearchFieldDataType.String),
#                         filterable=True,
#                     )
#                 )
#             if self.use_int_vectorization:
#                 fields.append(SearchableField(name="parent_id", type="Edm.String", filterable=True))
#             if self.search_images:
#                 fields.append(
#                     SearchField(
#                         name="imageEmbedding",
#                         type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
#                         hidden=False,
#                         searchable=True,
#                         filterable=False,
#                         sortable=False,
#                         facetable=False,
#                         vector_search_dimensions=1024,
#                         vector_search_profile_name="embedding_config",
#                     ),
#                 )
       
#         for index_name in self.search_info.index_name_list:                
#             index = SearchIndex(
#                 name= index_name,
#                 fields=fields,
#                 semantic_search=SemanticSearch(
#                     configurations=[
#                         SemanticConfiguration(
#                             name="default",
#                             prioritized_fields=SemanticPrioritizedFields(
#                                 title_field=None, content_fields=[SemanticField(field_name="content")]
#                             ),
#                         )
#                     ]
#                 ),
#                 vector_search=VectorSearch(
#                     algorithms=[
#                         HnswAlgorithmConfiguration(
#                             name="hnsw_config",
#                             parameters=HnswParameters(metric="cosine"),
#                         )
#                     ],
#                     profiles=[
#                         VectorSearchProfile(
#                             name="embedding_config",
#                             algorithm_configuration_name="hnsw_config",
#                             vectorizer=(
#                                 f"{self.search_info.index_name}-vectorizer" if self.use_int_vectorization else None
#                             ),
#                         ),
#                     ],
#                     vectorizers=vectorizers,
#                 ),
#             )
#             #if self.search_info.index_name not in [name async for name in search_index_client.list_index_names()]:
#             if index_name not in [name async for name in search_index_client.list_index_names()]:
                
                
#                 logger.info("Creating %s search index", index_name)
#                 await search_index_client.create_index(index)
#             else:
#                 logger.info("Search index %s already exists", index_name)
#                 index_definition = await search_index_client.get_index(index_name)
#                 if not any(field.name == "storageUrl" for field in index_definition.fields):
#                     logger.info("Adding storageUrl field to index %s", index_name)
#                     index_definition.fields.append(
#                         SimpleField(
#                             name="storageUrl",
#                             type="Edm.String",
#                             filterable=True,
#                             facetable=False,
#                         ),
#                     )
#                     await search_index_client.create_or_update_index(index_definition)

#     async def update_content(
#         self, index_name: str, sections: List[Section], image_embeddings: Optional[List[List[float]]] = None, url: Optional[str] = None
#     ):
#         MAX_BATCH_SIZE = 1000
#         section_batches = [sections[i : i + MAX_BATCH_SIZE] for i in range(0, len(sections), MAX_BATCH_SIZE)]

#         async with self.search_info.create_search_client(index_name) as search_client:
#             for batch_index, batch in enumerate(section_batches):
#                 documents = [
#                     {
#                         "id": f"{section.content.filename_to_id()}-page-{section_index + batch_index * MAX_BATCH_SIZE}",
#                         "content": section.split_page.text,
#                         "category": section.category,
#                         "sourcepage": (
#                             BlobManager.blob_image_name_from_file_page(
#                                 filename=section.content.filename(),
#                                 page=section.split_page.page_num,
#                             )
#                             if image_embeddings
#                             else BlobManager.sourcepage_from_file_page(
#                                 filename=section.content.filename(),
#                                 page=section.split_page.page_num,
#                             )
#                         ),
#                         "sourcefile": section.content.filename(),
#                         **section.content.acls,
#                     }
#                     for section_index, section in enumerate(batch)
#                 ]
#                 if url:
#                     for document in documents:
#                         document["storageUrl"] = url
#                 if self.embeddings:
#                     embeddings = await self.embeddings.create_embeddings(
#                         texts=[section.split_page.text for section in batch]
#                     )
#                     for i, document in enumerate(documents):
#                         document["embedding"] = embeddings[i]
#                 if image_embeddings:
#                     for i, (document, section) in enumerate(zip(documents, batch)):
#                         document["imageEmbedding"] = image_embeddings[section.split_page.page_num]

#                 await search_client.upload_documents(documents)

#     async def remove_content(self, path: Optional[str] = None, only_oid: Optional[str] = None):
#         logger.info(
#             "Removing sections from '{%s or '<all>'}' from search index '%s'", path, self.search_info.index_name
#         )
#         async with self.search_info.create_search_client() as search_client:
#             while True:
#                 filter = None
#                 if path is not None:
#                     # Replace ' with '' to escape the single quote for the filter
#                     # https://learn.microsoft.com/azure/search/query-odata-filter-orderby-syntax#escaping-special-characters-in-string-constants
#                     path_for_filter = os.path.basename(path).replace("'", "''")
#                     filter = f"sourcefile eq '{path_for_filter}'"
#                 max_results = 1000
#                 result = await search_client.search(
#                     search_text="", filter=filter, top=max_results, include_total_count=True
#                 )
#                 result_count = await result.get_count()
#                 if result_count == 0:
#                     break
#                 documents_to_remove = []
#                 async for document in result:
#                     # If only_oid is set, only remove documents that have only this oid
#                     if not only_oid or document.get("oids") == [only_oid]:
#                         documents_to_remove.append({"id": document["id"]})
#                 if len(documents_to_remove) == 0:
#                     if result_count < max_results:
#                         break
#                     else:
#                         continue
#                 removed_docs = await search_client.delete_documents(documents_to_remove)
#                 logger.info("Removed %d sections from index", len(removed_docs))
#                 # It can take a few seconds for search results to reflect changes, so wait a bit
#                 await asyncio.sleep(2)

import asyncio
import logging
import os
from typing import List, Optional

from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    HnswParameters,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SemanticConfiguration,
    SemanticField,
    SemanticPrioritizedFields,
    SemanticSearch,
    SimpleField,
    VectorSearch,
    VectorSearchProfile,
    VectorSearchVectorizer,
)

from .blobmanager import BlobManager
from .embeddings import OpenAIEmbeddings
from .listfilestrategy import File
from .strategy import SearchInfo
from .textsplitter import SplitPage

logger = logging.getLogger("ingester")


class Section:
    """
    A section of a page that is stored in a search service. These sections are used as context by Azure OpenAI service
    """

    def __init__(self, split_page: SplitPage, content: File, category: Optional[str] = None):
        self.split_page = split_page
        self.content = content
        self.category = category


class SearchManager:
    """
    Class to manage a search service. It can create indexes, and update or remove sections stored in these indexes
    To learn more, please visit https://learn.microsoft.com/azure/search/search-what-is-azure-search
    """

    def __init__(
        self,
        search_info: SearchInfo,
        search_analyzer_name: Optional[str] = None,
        use_acls: bool = False,
        use_int_vectorization: bool = False,
        embeddings: Optional[OpenAIEmbeddings] = None,
        search_images: bool = False,
    ):
        self.search_info = search_info
        self.search_analyzer_name = search_analyzer_name
        self.use_acls = use_acls
        self.use_int_vectorization = use_int_vectorization
        self.embeddings = embeddings
        # Integrated vectorization uses the ada-002 model with 1536 dimensions
        self.embedding_dimensions = self.embeddings.open_ai_dimensions if self.embeddings else 1536
        self.search_images = search_images

    async def create_index(self, vectorizers: Optional[List[VectorSearchVectorizer]] = None):
        # logger.info("Ensuring search index %s exists", self.search_info.index_name)

        async with self.search_info.create_search_index_client() as search_index_client:
            fields = [
                (
                    SimpleField(name="id", type="Edm.String", key=True)
                    if not self.use_int_vectorization
                    else SearchField(
                        name="id",
                        type="Edm.String",
                        key=True,
                        sortable=True,
                        filterable=True,
                        facetable=True,
                        analyzer_name="keyword",
                    )
                ),
                SearchableField(
                    name="content",
                    type="Edm.String",
                    analyzer_name=self.search_analyzer_name,
                ),
                SearchField(
                    name="embedding",
                    type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                    hidden=False,
                    searchable=True,
                    filterable=False,
                    sortable=False,
                    facetable=False,
                    vector_search_dimensions=self.embedding_dimensions,
                    vector_search_profile_name="embedding_config",
                ),
                SimpleField(name="category", type="Edm.String", filterable=True, facetable=True),
                SimpleField(
                    name="sourcepage",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                ),
                SimpleField(
                    name="sourcefile",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                ),
                SimpleField(
                    name="storageUrl",
                    type="Edm.String",
                    filterable=True,
                    facetable=False,
                ),
            ]
            if self.use_acls:
                fields.append(
                    SimpleField(
                        name="oids",
                        type=SearchFieldDataType.Collection(SearchFieldDataType.String),
                        filterable=True,
                    )
                )
                fields.append(
                    SimpleField(
                        name="groups",
                        type=SearchFieldDataType.Collection(SearchFieldDataType.String),
                        filterable=True,
                    )
                )
            if self.use_int_vectorization:
                fields.append(SearchableField(name="parent_id", type="Edm.String", filterable=True))
            if self.search_images:
                fields.append(
                    SearchField(
                        name="imageEmbedding",
                        type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                        hidden=False,
                        searchable=True,
                        filterable=False,
                        sortable=False,
                        facetable=False,
                        vector_search_dimensions=1024,
                        vector_search_profile_name="embedding_config",
                    ),
                )

            for index_name in self.search_info.index_name_list: 
                index = SearchIndex(
                    # name=self.search_info.index_name,
                    name = index_name,
                    fields=fields,
                    semantic_search=SemanticSearch(
                        configurations=[
                            SemanticConfiguration(
                                name="default",
                                prioritized_fields=SemanticPrioritizedFields(
                                    title_field=None, content_fields=[SemanticField(field_name="content")]
                                ),
                            )
                        ]
                    ),
                    vector_search=VectorSearch(
                        algorithms=[
                            HnswAlgorithmConfiguration(
                                name="hnsw_config",
                                parameters=HnswParameters(metric="cosine"),
                            )
                        ],
                        profiles=[
                            VectorSearchProfile(
                                name="embedding_config",
                                algorithm_configuration_name="hnsw_config",
                                vectorizer=(
                                    f"{self.search_info.index_name}-vectorizer" if self.use_int_vectorization else None
                                ),
                            ),
                        ],
                        vectorizers=vectorizers,
                    ),
                )
                #if self.search_info.index_name not in [name async for name in search_index_client.list_index_names()]:
                if index_name not in [name async for name in search_index_client.list_index_names()]:
                    # logger.info("Creating %s search index", self.search_info.index_name)
                    # await search_index_client.create_index(index)
                    logger.info("Creating %s search index", index_name)
                    await search_index_client.create_index(index)
                else:
                    logger.info("Search index %s already exists", index_name)
                    index_definition = await search_index_client.get_index(index_name)
                    if not any(field.name == "storageUrl" for field in index_definition.fields):
                        logger.info("Adding storageUrl field to index %s", index_name)
                        index_definition.fields.append(
                            SimpleField(
                                name="storageUrl",
                                type="Edm.String",
                                filterable=True,
                                facetable=False,
                            ),
                        )
                        await search_index_client.create_or_update_index(index_definition)
                        
    async def update_content(
        self, index_name: str, sections: List[Section], image_embeddings: Optional[List[List[float]]] = None, url: Optional[str] = None
    ):
        MAX_BATCH_SIZE = 1000
        section_batches = [sections[i : i + MAX_BATCH_SIZE] for i in range(0, len(sections), MAX_BATCH_SIZE)]

        async with self.search_info.create_search_client(index_name) as search_client:
            for batch_index, batch in enumerate(section_batches):
                documents = [
                    {
                        "id": f"{section.content.filename_to_id()}-page-{section_index + batch_index * MAX_BATCH_SIZE}",
                        "content": section.split_page.text,
                        "category": section.category,
                        "sourcepage": (
                            BlobManager.blob_image_name_from_file_page(
                                filename=section.content.filename(),
                                page=section.split_page.page_num,
                            )
                            if image_embeddings
                            else BlobManager.sourcepage_from_file_page(
                                filename=section.content.filename(),
                                page=section.split_page.page_num,
                            )
                        ),
                        "sourcefile": section.content.filename(),
                        **section.content.acls,
                    }
                    for section_index, section in enumerate(batch)
                ]
                if url:
                    for document in documents:
                        document["storageUrl"] = url
                if self.embeddings:
                    embeddings = await self.embeddings.create_embeddings(
                        texts=[section.split_page.text for section in batch]
                    )
                    for i, document in enumerate(documents):
                        document["embedding"] = embeddings[i]
                if image_embeddings:
                    for i, (document, section) in enumerate(zip(documents, batch)):
                        document["imageEmbedding"] = image_embeddings[section.split_page.page_num]

                await search_client.upload_documents(documents)
                
    async def update_partial_content(
    self, index_name: str, sections: List[Section], image_embeddings: Optional[List[List[float]]] = None, url: Optional[str] = None
    ):
        MAX_BATCH_SIZE = 1000
        section_batches = [sections[i: i + MAX_BATCH_SIZE] for i in range(0, len(sections), MAX_BATCH_SIZE)]

        async with self.search_info.create_search_client(index_name) as search_client:
            for batch_index, batch in enumerate(section_batches):
                for section_index, section in enumerate(batch):
                    sourcepage_value = (
                        BlobManager.blob_image_name_from_file_page(
                            filename=section.content.filename(),
                            page=section.split_page.page_num,
                        )
                        if image_embeddings
                        else BlobManager.sourcepage_from_file_page(
                            filename=section.content.filename(),
                            page=section.split_page.page_num,
                        )
                    )
                    
                    # logger.info("sourcepage_value= '%s'", sourcepage_value)
                    
                    # Search for the document using sourcepage value
                    results = await search_client.search(
                        search_text="",  # Empty search text, we are using filter
                        filter=f"sourcepage eq '{sourcepage_value}'"
                    )
                    
                    # logger.info("results= '%s'", results)
                    
                    # Iterate through results to update each matching document
                    async for result in results:
                        document_id = result['id']
                        
                        # logger.info("document_id= '%s'", document_id)
                        
                        # Prepare the update payload
                        update_document = {
                            "id": document_id,
                            "oids": section.content.acls.get("oids", None),  # Update with new oids
                            "groups": section.content.acls.get("groups", None),  # Update with new groups
                            "@search.action": "merge"  # Partial update action
                        }
                        
                        # logger.info("update_document= '%s'", update_document)
                        
                        # Remove None values
                        update_document = {k: v for k, v in update_document.items() if v is not None}
                        
                        # logger.info("update_document= '%s'", update_document)
                        
                        # Perform the partial update
                        await search_client.upload_documents([update_document])


    async def remove_content(self, path: Optional[str] = None, only_oid: Optional[str] = None):
        logger.info(
            "Removing sections from '{%s or '<all>'}' from search index '%s'", path, self.search_info.index_name
        )
        async with self.search_info.create_search_client() as search_client:
            while True:
                filter = None
                if path is not None:
                    # Replace ' with '' to escape the single quote for the filter
                    # https://learn.microsoft.com/azure/search/query-odata-filter-orderby-syntax#escaping-special-characters-in-string-constants
                    path_for_filter = os.path.basename(path).replace("'", "''")
                    filter = f"sourcefile eq '{path_for_filter}'"
                max_results = 1000
                result = await search_client.search(
                    search_text="", filter=filter, top=max_results, include_total_count=True
                )
                result_count = await result.get_count()
                if result_count == 0:
                    break
                documents_to_remove = []
                async for document in result:
                    # If only_oid is set, only remove documents that have only this oid
                    if not only_oid or document.get("oids") == [only_oid]:
                        documents_to_remove.append({"id": document["id"]})
                if len(documents_to_remove) == 0:
                    if result_count < max_results:
                        break
                    else:
                        continue
                removed_docs = await search_client.delete_documents(documents_to_remove)
                logger.info("Removed %d sections from index", len(removed_docs))
                # It can take a few seconds for search results to reflect changes, so wait a bit
                await asyncio.sleep(2)
                
    # # metodo para verificar se os search index contem ficheiros
    # async def index_has_documents(self, index_name: str) -> bool:
    #     async with self.search_info.create_search_client(index_name) as search_client:
    #         logger.info("index_has_documents")
    #         logger.info("index_name='%s'", index_name)
    #         result = await search_client.search(search_text="", top=1)  # Retrieve just one document
    #         logger.info("result='%s'", result)
    #         async for _ in result:
    #             return True  # If we get any document, the index has content
    #     return False  # If no document is found, the index is empty
    
    async def index_has_documents(self, index_name: str) -> bool:
        """
        Check if the given index contains any documents.
        """
        async with self.search_info.create_search_client(index_name) as search_client:
            logger.info("Check if index_has_documents")
            logger.info("index_name='%s'", index_name)
            logger.info("search_client='%s'", search_client)
            # Perform a simple search with no filters to count the number of documents
            # result = await search_client.search(search_text="", top=1)  # Get only the first document
            # result_count = await result.get_count()
            # logger.info("result_count='%s'", result_count)
            result = await search_client.get_document_count()
            logger.info("result='%s'", result)
            return result > 0


