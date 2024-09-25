// import React, { useEffect, useRef, useState } from "react";
// import { Link } from "react-router-dom";

// import { useLogin } from "../../authConfig";
// import { LoginButton } from "../../components/LoginButton";
// import { SideMenu } from "../../components/SideMenu";
// import superbockLogo from "../../assets/superbockLogo.jpg";
// import styles from "./Layout.module.css";
// import Chat, { ChatHandles } from "../chat/Chat";
// import { USE_CASES } from "../../helpers/constants";

// const Layout = React.forwardRef<HTMLDivElement>((props, ref) => {
//   const mainContainerRef = useRef<HTMLDivElement>(null);
//   const chatRef = useRef<ChatHandles>(null);

//   const [activeUseCase, setActiveUseCase] = useState<USE_CASES | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [hasUserScrolledUp, setHasUserScrolledUp] = useState<boolean>(false);
//   const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

//   const handleUseCaseSelect = (caseId: USE_CASES) => {
//     setActiveUseCase(caseId);
//     setIsChatVisible(true); // Show chat when a use case is selected
//   };

//   const checkIfScrollIsAtBottom = () => {
//     const scrollOffset = 10;
//     if (!mainContainerRef.current) return false;

//     const scrolledFromTop = mainContainerRef.current.scrollTop;
//     const viewportHeight = mainContainerRef.current.clientHeight;
//     const totalContentHeight = mainContainerRef.current.scrollHeight;

//     return (
//       totalContentHeight - scrolledFromTop - viewportHeight <= scrollOffset
//     );
//   };

//   const handleLogoClick = () => {
//     if (chatRef.current) {
//       chatRef.current.clearChat();
//     }
//   };

//   useEffect(() => {
//     const checkHasScroll = () => {
//       const isAtBottom = checkIfScrollIsAtBottom();
//       if (!isAtBottom) setHasUserScrolledUp(true);
//       else setHasUserScrolledUp(false);
//     };

//     mainContainerRef.current?.addEventListener("scroll", checkHasScroll);

//     return () => {
//       mainContainerRef.current?.removeEventListener("scroll", checkHasScroll);
//     };
//   }, []);

//   return (
//     <div className={styles.layout} ref={ref}>
//       <header className={styles.header} role={"banner"}>
//         <div className={styles.headerContainer}>
//           <button
//             className={styles.logoButton}
//             onClick={handleLogoClick}
//             disabled={isLoading}
//           >
//             <img
//               src={superbockLogo}
//               alt="SUPERBOCK Logo"
//               aria-label="Link to main page"
//               className={styles.companyLogo}
//             />
//           </button>
//           <div />

//           {useLogin && <LoginButton />}
//         </div>
//       </header>
//       {/* Add red bar here */}
//       <div className={styles.redBar}></div>
//       <div className={styles.bodyContainer}>
//         <SideMenu
//           activeUseCase={activeUseCase}
//           onCaseSelect={handleUseCaseSelect}
//           isLoading={isLoading}
//           setIsChatVisible={setIsChatVisible} // Pass function to control visibility
//         />

//         <main ref={mainContainerRef} className={styles.mainContent}>
//           {!isChatVisible || activeUseCase === null ? (
//             <div className={styles.chatEmptyState}>
//               <div className={styles.selectTopicMessage}>
//               Olá, sou o chatbot SBG! <br></br>
//                    Seleciona um tópico da lista para conversarmos
//               </div>
//             </div>
//           ) : (
//             <Chat
//               ref={chatRef}
//               activeUseCase={activeUseCase}
//               isLoading={isLoading}
//               setIsLoading={setIsLoading}
//               hasUserScrolledUp={hasUserScrolledUp}
//               isChatVisible={isChatVisible}
//             />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// });

// export default Layout;


import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useLogin } from "../../authConfig";
import { LoginButton } from "../../components/LoginButton";
import { SideMenu } from "../../components/SideMenu";
import superbockLogo from "../../assets/superbockLogo.jpg";
import styles from "./Layout.module.css";
import Chat, { ChatHandles } from "../chat/Chat";
import { USE_CASES } from "../../helpers/constants";

const Layout = React.forwardRef<HTMLDivElement>((props, ref) => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<ChatHandles>(null);

  const [activeUseCase, setActiveUseCase] = useState<USE_CASES | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUserScrolledUp, setHasUserScrolledUp] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<string>(""); // Store the selected topic

  // Handle use case selection
  const handleUseCaseSelect = (caseId: USE_CASES) => {
    setActiveUseCase(caseId);
    setIsChatVisible(true); // Show chat when a use case is selected
  };

  // Handle topic selection
  const handleTopicSelect = (topic: string) => {
    console.log("Selected Topic:", topic);
    setSelectedTopic(topic); // Store the selected topic
  };

  

  const checkIfScrollIsAtBottom = () => {
    const scrollOffset = 10;
    if (!mainContainerRef.current) return false;

    const scrolledFromTop = mainContainerRef.current.scrollTop;
    const viewportHeight = mainContainerRef.current.clientHeight;
    const totalContentHeight = mainContainerRef.current.scrollHeight;

    return (
      totalContentHeight - scrolledFromTop - viewportHeight <= scrollOffset
    );
  };

  const handleLogoClick = () => {
    if (chatRef.current) {
      chatRef.current.clearChat();
    }
  };

  useEffect(() => {
    const checkHasScroll = () => {
      const isAtBottom = checkIfScrollIsAtBottom();
      if (!isAtBottom) setHasUserScrolledUp(true);
      else setHasUserScrolledUp(false);
    };

    mainContainerRef.current?.addEventListener("scroll", checkHasScroll);

    return () => {
      mainContainerRef.current?.removeEventListener("scroll", checkHasScroll);
    };
  }, []);

  return (
    <div className={styles.layout} ref={ref}>
      <header className={styles.header} role={"banner"}>
        <div className={styles.headerContainer}>
          <button
            className={styles.logoButton}
            onClick={handleLogoClick}
            disabled={isLoading}
          >
            <img
              src={superbockLogo}
              alt="SUPERBOCK Logo"
              aria-label="Link to main page"
              className={styles.companyLogo}
            />
          </button>
          <div />

          {useLogin && <LoginButton />}
        </div>
      </header>
      {/* Add red bar here */}
      <div className={styles.redBar}></div>
      <div className={styles.bodyContainer}>
        <SideMenu
          activeUseCase={activeUseCase}
          onCaseSelect={handleUseCaseSelect}
          isLoading={isLoading}
          setIsChatVisible={setIsChatVisible} // Pass function to control visibility
          onTopicSelect={handleTopicSelect} // Pass the topic selection handler
        />

        <main ref={mainContainerRef} className={styles.mainContent}>
          {!isChatVisible || activeUseCase === null ? (
            <div className={styles.chatEmptyState}>
              <div className={styles.selectTopicMessage}>
              Olá, sou o chatbot SBG! <br></br>
                   Seleciona um tópico da lista para conversarmos
              </div>
            </div>
          ) : (
            <Chat
              ref={chatRef}
              activeUseCase={activeUseCase}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              hasUserScrolledUp={hasUserScrolledUp}
              isChatVisible={isChatVisible}
              selectedTopic={selectedTopic}
            />
          )}
        </main>
      </div>
    </div>
  );
});

export default Layout;
