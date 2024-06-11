// import { Outlet, NavLink, Link } from "react-router-dom";

// import github from "../../assets/github.svg";

// import styles from "./Layout.module.css";

// import { useLogin } from "../../authConfig";

// import { LoginButton } from "../../components/LoginButton";

// const Layout = () => {
//     return (
//         <div className={styles.layout}>
//             <header className={styles.header} role={"banner"}>
//                 <div className={styles.headerContainer}>
//                     <Link to="/" className={styles.headerTitleContainer}>
//                         <h3 className={styles.headerTitle}>GPT + Enterprise data | SUPERBOCK</h3>
//                     </Link>
//                     <nav>
//                         <ul className={styles.headerNavList}>
//                             <li>
//                                 <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
//                                     Tema 1
//                                 </NavLink>
//                             </li>
//                             <li className={styles.headerNavLeftMargin}>
//                                 <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
//                                     Tema 2
//                                 </NavLink>
//                             </li>
//                             <li className={styles.headerNavLeftMargin}>
//                                 <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
//                                     Tema 3
//                                 </NavLink>
//                             </li>
//                             <li className={styles.headerNavLeftMargin}>
//                                 <a href="https://aka.ms/entgptsearch" target={"_blank"} title="Github repository link">
//                                     <img
//                                         src={github}
//                                         alt="Github logo"
//                                         aria-label="Link to github repository"
//                                         width="20px"
//                                         height="20px"
//                                         className={styles.githubLogo}
//                                     />
//                                 </a>
//                             </li>
//                         </ul>
//                     </nav>
//                     <h4 className={styles.headerRightText}>Azure OpenAI + AI Search</h4>
//                     {useLogin && <LoginButton />}
//                 </div>
//             </header>

//             <Outlet />
//         </div>
//     );
// };

// export default Layout;














import React, { useEffect, useRef, useState } from "react";

import { useLogin } from "../../authConfig";
import { LoginButton } from "../../components/LoginButton";
import plmjLogo from "../../assets/plmjLogo.png";
import styles from "./Layout.module.css";
import Chat, { ChatHandles } from "../chat/Chat";
import { USE_CASES } from "../../helpers/constants";

const Layout = React.forwardRef<HTMLDivElement>((props, ref) => {
const mainContainerRef = useRef<HTMLDivElement>(null);
const chatRef = useRef<ChatHandles>(null);

const [activeUseCase, setActiveUseCase] = useState<USE_CASES>(
    USE_CASES.COMPLIANCE
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
        {/* <Link to="/" className={styles.headerTitleContainer}>
            <h3 className={styles.headerTitle}>Ask PLMJ AI</h3>
        </Link> */}
        <button
            className={styles.logoButton}
            onClick={handleLogoClick}
            disabled={isLoading}
        >
            <img
            src={plmjLogo}
            alt="PLMJ Logo"
            aria-label="Link to main page"
            className={styles.companyLogo}
            />
        </button>
        <div />

        {useLogin && <LoginButton />}
        </div>
    </header>

    <div className={styles.bodyContainer}>
        {/* <SideMenu
        activeUseCase={activeUseCase}
        onCaseSelect={handleUseCaseSelect}
        isLoading={isLoading}
        /> */}

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

