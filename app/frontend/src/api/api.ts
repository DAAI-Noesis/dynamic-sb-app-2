const BACKEND_URI = "";

import { ChatAppResponse, ChatAppResponseOrError, ChatAppRequest, Config, SimpleAPIResponse } from "./models";

import { useLogin, appServicesToken } from "../authConfig";

export function getHeaders(
  idToken: string | undefined
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  // If using login and not using app services, add the id token of the logged in account as the authorization
  if (useLogin && appServicesToken == null) {
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }
  }

  return headers;
}


export async function askApi(
  request: ChatAppRequest,
  idToken: string | undefined
): Promise<Response> {
  const response = await fetch(`${BACKEND_URI}/ask`, {
    method: "POST",
    headers: getHeaders(idToken),
    body: JSON.stringify(request)
  });

  // const parsedResponse: ChatAppResponseOrError = await response.json();
  if (response.status > 299 || !response.ok) {
    const parsedResponse: ChatAppResponseOrError = await response.json();
    throw Error(parsedResponse.error || "Unknown error");
  }

  return response;
}

// export async function askApi(request: ChatAppRequest, idToken: string | undefined): Promise<ChatAppResponse> {
//   const response = await fetch(`${BACKEND_URI}/ask`, {
//       method: "POST",
//       headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
//       body: JSON.stringify(request)
//   });

//   const parsedResponse: ChatAppResponseOrError = await response.json();
//   if (response.status > 299 || !response.ok) {
//       throw Error(parsedResponse.error || "Unknown error");
//   }

//   return parsedResponse as ChatAppResponse;
// }

export async function configApi(idToken: string | undefined): Promise<Config> {
  const response = await fetch(`${BACKEND_URI}/config`, {
    method: "GET",
    headers: getHeaders(idToken)
  });

  return (await response.json()) as Config;
}

export async function chatApi(
  request: ChatAppRequest,
  idToken: string | undefined
): Promise<Response> {
  return await fetch(`${BACKEND_URI}/chat`, {
    method: "POST",
    headers: getHeaders(idToken),
    body: JSON.stringify(request)
  });
}

// export async function chatApi(request: ChatAppRequest, idToken: string | undefined): Promise<Response> {
//   return await fetch(`${BACKEND_URI}/chat`, {
//       method: "POST",
//       headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
//       body: JSON.stringify(request)
//   });
// }

export async function chat2Api(
  request: ChatAppRequest,
  idToken: string | undefined
): Promise<Response> {
  return await fetch(`${BACKEND_URI}/chat2`, {
      method: "POST",
      headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
      body: JSON.stringify(request)
  });
}
export async function chat3Api(
  request: ChatAppRequest,
  idToken: string | undefined
): Promise<Response> {
  return await fetch(`${BACKEND_URI}/chat3`, {
      method: "POST",
      headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
      body: JSON.stringify(request)
  });
}
export async function chat4Api(
  request: ChatAppRequest,
  idToken: string | undefined
): Promise<Response> {
  return await fetch(`${BACKEND_URI}/chat4`, {
      method: "POST",
      headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
      body: JSON.stringify(request)
  });
}
export async function chat5Api(
  request: ChatAppRequest,
  idToken: string | undefined
): Promise<Response> {
  return await fetch(`${BACKEND_URI}/chat5`, {
      method: "POST",
      headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
      body: JSON.stringify(request)
  });
}

export async function listFoldersApi(idToken: string | undefined): Promise<string[]> {
  try {
    const response = await fetch(`${BACKEND_URI}/list_folders`, {
      method: "GET",
      headers:  { ...getHeaders(idToken), "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Error fetching folders: ${response.statusText}`);
    }

    return await response.json() as string[];
  } catch (error) {
    console.error('Error in listFoldersApi:', error);
    throw error;
  }
}

export async function feedbackApi(
  answer: string
): Promise<Response> {
  return await fetch(`${BACKEND_URI}/feedback_insert`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json', // Set the content type to JSON
    },
    body: answer
  });
}


// export async function listFoldersApi(idToken: string | undefined): Promise<string[]> {
//   try {
//     const response = await fetch(`${BACKEND_URI}/list_folders`, {
//       method: "GET",
//       headers: getHeaders(idToken)
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`Error fetching folders: ${response.statusText}. Response: ${errorText}`);
//       throw new Error(`Error fetching folders: ${response.statusText}`);
//     }

//     const data = await response.json();
    
//     if (!Array.isArray(data)) {
//       console.error(`Unexpected response format: ${JSON.stringify(data)}`);
//       throw new Error('Unexpected response format');
//     }

//     return data as string[];
//   } catch (error) {
//     console.error('Error in listFoldersApi:', error);
//     throw error;
//   }
// }


export function getCitationFilePath(citation: string): string {
  return `${BACKEND_URI}/content/${citation}`;
}

export async function uploadFileApi(request: FormData, idToken: string): Promise<SimpleAPIResponse> {
    const response = await fetch("/upload", {
        method: "POST",
        headers: getHeaders(idToken),
        body: request
    });

    if (!response.ok) {
        throw new Error(`Uploading files failed: ${response.statusText}`);
    }

    const dataResponse: SimpleAPIResponse = await response.json();
    return dataResponse;
}

export async function deleteUploadedFileApi(filename: string, idToken: string): Promise<SimpleAPIResponse> {
    const response = await fetch("/delete_uploaded", {
        method: "POST",
        headers: { ...getHeaders(idToken), "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
    });

    if (!response.ok) {
        throw new Error(`Deleting file failed: ${response.statusText}`);
    }

    const dataResponse: SimpleAPIResponse = await response.json();
    return dataResponse;
}

export async function listUploadedFilesApi(idToken: string): Promise<string[]> {
    const response = await fetch(`/list_uploaded`, {
        method: "GET",
        headers: getHeaders(idToken)
    });

    if (!response.ok) {
        throw new Error(`Listing files failed: ${response.statusText}`);
    }

    const dataResponse: string[] = await response.json();
    return dataResponse;
}
