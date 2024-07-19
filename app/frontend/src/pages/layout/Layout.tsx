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

  const [activeUseCase, setActiveUseCase] = useState<USE_CASES>(
    USE_CASES.THEME_1
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUserScrolledUp, setHasUserScrolledUp] = useState<boolean>(false);

  const handleUseCaseSelect = (caseId: USE_CASES) => {
    setActiveUseCase(caseId);
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
  });

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

      <div className={styles.bodyContainer}>
        <SideMenu
          activeUseCase={activeUseCase}
          onCaseSelect={handleUseCaseSelect}
          isLoading={isLoading}
        />

        <main ref={mainContainerRef} className={styles.mainContent}>
          <Chat
            ref={chatRef}
            activeUseCase={activeUseCase}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            hasUserScrolledUp={hasUserScrolledUp}
          />
        </main>
      </div>
    </div>
  );
});

export default Layout;
