// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import { USE_CASES } from "../../helpers/constants";
// import styles from "./SideMenu.module.css";
// import {
//   askApi,
//   chatApi,
//   chat2Api,
//   chat3Api,
//   chat4Api,
//   chat5Api,
//   listFoldersApi
// } from "../../api";
// import { ChatAppRequest } from "../../api/models";
// import debounce from 'lodash.debounce';
// import { useMsal } from "@azure/msal-react";
// import { useLogin, getToken, isLoggedIn, requireAccessControl } from "../../authConfig";
// import { getHeaders } from '../../api';

// type SideMenuProps = {
//   activeUseCase: USE_CASES;
//   onCaseSelect: (chatId: USE_CASES) => void;
//   isLoading: boolean;
// };

// export const THEME_MAPPINGS: USE_CASES[] = [
//   USE_CASES.THEME_1,
//   USE_CASES.THEME_2,
//   USE_CASES.THEME_3,
//   USE_CASES.THEME_4,
//   USE_CASES.THEME_5,
//   USE_CASES.THEME_6
// ];

// const useCaseApis = {
//   [USE_CASES.THEME_1]: askApi,
//   [USE_CASES.THEME_2]: chatApi,
//   [USE_CASES.THEME_3]: chat2Api,
//   [USE_CASES.THEME_4]: chat3Api,
//   [USE_CASES.THEME_5]: chat4Api,
//   [USE_CASES.THEME_6]: chat5Api
// };

// const handleUseCaseRequest = async (
//   request: ChatAppRequest,
//   token: string | undefined,
//   activeUseCase: USE_CASES
// ): Promise<Response> => {
//   const apiFunction = useCaseApis[activeUseCase];
//   if (apiFunction) {
//     return apiFunction(request, token);
//   } else {
//     throw new Error(`Unhandled use case: ${activeUseCase}`);
//   }
// };




// export const SideMenu = ({
//   activeUseCase,
//   onCaseSelect,
//   isLoading
// }: SideMenuProps) => {
//   const [folders, setFolders] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const cacheRef = useRef<Record<string, any>>({});
//   const client = useLogin ? useMsal().instance : undefined;
  
//   const fetchFolders = useCallback(async (idToken: string | undefined) => {
//     try {
//       const folders = await listFoldersApi(idToken);
//       // added this line
//       setFolders(folders || []);

//       // if (!folders || folders.length === 0) {
//       //   setFolders([]);
//       //   return;
//       // }

//       // setFolders(folders);
//     } catch (error) {
//       console.error('Error in fetchFolders:', error);
//       setError(error instanceof Error ? error.message : 'Error fetching folders');
//     }
//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = client ? await getToken(client) : undefined;
//         await fetchFolders(token);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, [client, fetchFolders]);

//   const getUseCaseKeyFromIndex = useCallback((index: number): USE_CASES | null => {
//     return THEME_MAPPINGS[index] || null;
//   }, []);

//   const handleClick = useCallback(async (index: number) => {
//     if (!isLoading) {
//       try {
//         const useCaseKey = getUseCaseKeyFromIndex(index);
//         if (!useCaseKey) {
//           throw new Error(`Invalid topic index: ${index}`);
//         }

//         if (cacheRef.current[useCaseKey]) {
//           onCaseSelect(useCaseKey);
//           return;
//         }

//         const request: ChatAppRequest = {
//           messages: [{ role: 'user', content: `Request for topic ${index}` }],
//           context: { overrides: { vector_fields: [] } },
//           stream: false,
//           session_state: {}
//         };

//         const token = client ? await getToken(client) : undefined;
//         const response = await handleUseCaseRequest(request, token, useCaseKey);
//         if (!response.body) {
//           throw Error("No response body");
//         }

//         cacheRef.current[useCaseKey] = response;
//         console.log(response);
//         onCaseSelect(useCaseKey);

//       } catch (error) {
//         console.error('Error handling use case:', error);
//         setError(error instanceof Error ? error.message : 'Error handling request');
//       }
//     }
//   }, [getUseCaseKeyFromIndex, isLoading, onCaseSelect]);

//   const debouncedHandleClick = useMemo(() => debounce((index: number) => handleClick(index), 0), [handleClick]);
//   // added this 2 lines
//   const selectedFolderIndex = THEME_MAPPINGS.indexOf(activeUseCase);
//   const selectedFolder = selectedFolderIndex !== -1 ? folders[selectedFolderIndex] : null;
  
//   return (
//     <aside className={styles.sideMenuContainer}>
//       <div>
//         <div className={styles.sideMenuHeader}>
//           <h2>Tópicos de conversa</h2>
//         </div>
//         <ul className={styles.chatList}>
//           {folders.length > 0 ? (
//             folders.map((folder, index) => (
//               <li
//                 key={index}
//                 className={`${styles.menuOption} ${activeUseCase === getUseCaseKeyFromIndex(index) ? styles.activeOption : ""} ${isLoading ? styles.disabledOption : ""}`}
//                 onClick={() => debouncedHandleClick(index)}
//               >
//                  <strong>{folder}</strong> 
//                 <p style={{ fontSize: '12px', color: 'gray' }}> {/* Texto menor e cinzento para "Descrição do Tópico" */}
//                 Descrição do Tópico
//               </p>
//               </li>
//             ))
//           ) : (
//             <li>A carregar Tópicos...</li>
//           )}
//         </ul>
//         {/* <ul className={styles.chatList}>
//           {selectedFolder ? (
//             <li
//               key={selectedFolder}
//               className={`${styles.menuOption} ${styles.activeOption} ${isLoading ? styles.disabledOption : ""}`}
//               onClick={() => debouncedHandleClick(selectedFolderIndex)}
//             >
//               {selectedFolder}
//             </li>
//           ) : (
//             <li>No folders available</li>
//           )}
//         </ul> */}
//         {error && <p className={styles.error}>{error}</p>}
//       </div>
//     </aside>
//   );
// };

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { USE_CASES } from "../../helpers/constants";
import styles from "./SideMenu.module.css";
import {
  askApi,
  chatApi,
  chat2Api,
  chat3Api,
  chat4Api,
  chat5Api,
  listFoldersApi
} from "../../api";
import { ChatAppRequest } from "../../api/models";
import debounce from 'lodash.debounce';
import { useMsal } from "@azure/msal-react";
import { useLogin, getToken } from "../../authConfig";
import { getHeaders } from '../../api';

type SideMenuProps = {
  activeUseCase: USE_CASES | null;
  onCaseSelect: (chatId: USE_CASES) => void;
  isLoading: boolean;
  setIsChatVisible: (isVisible: boolean) => void; // Function to set chat visibility
};

export const THEME_MAPPINGS: USE_CASES[] = [
  USE_CASES.THEME_1,
  USE_CASES.THEME_2,
  USE_CASES.THEME_3,
  USE_CASES.THEME_4,
  USE_CASES.THEME_5,
  USE_CASES.THEME_6
];

export const SideMenu = ({
  activeUseCase,
  onCaseSelect,
  isLoading,
  setIsChatVisible // Function to control chat visibility
}: SideMenuProps) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTopicSelected, setIsTopicSelected] = useState<boolean>(false);
  const cacheRef = useRef<Record<string, any>>({});
  const client = useLogin ? useMsal().instance : undefined;

  const fetchFolders = useCallback(async (idToken: string | undefined) => {
    try {
      const folders = await listFoldersApi(idToken);
      setFolders(folders || []);
    } catch (error) {
      console.error('Error in fetchFolders:', error);
      setError(error instanceof Error ? error.message : 'Error fetching folders');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = client ? await getToken(client) : undefined;
        await fetchFolders(token);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [client, fetchFolders]);

  const handleClick = useCallback(async (index: number) => {
    if (!isLoading) {
      const useCaseKey = THEME_MAPPINGS[index];
      if (!useCaseKey) return;

      onCaseSelect(useCaseKey); 
      setIsChatVisible(true); // Show chat when a topic is selected
    }
  }, [isLoading, onCaseSelect, setIsChatVisible]);

  return (
    <aside className={styles.sideMenuContainer}>
      <div>
        <div className={styles.sideMenuHeader}>
          <h2>Tópicos de conversa</h2>
        </div>
        <ul className={styles.chatList}>
          {folders.length > 0 ? (
            folders.map((folder, index) => (
              <li
                key={index}
                className={`${styles.menuOption} ${activeUseCase === THEME_MAPPINGS[index] ? styles.activeOption : ""} ${isLoading ? styles.disabledOption : ""}`}
                onClick={() => handleClick(index)}
              >
                <strong>{folder}</strong>
                <p style={{ fontSize: '12px', color: 'gray' }}>
                  Descrição do Tópico
                </p>
              </li>
            ))
          ) : (
            <li>A carregar Tópicos...</li>
          )}
        </ul>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </aside>
  );
};



