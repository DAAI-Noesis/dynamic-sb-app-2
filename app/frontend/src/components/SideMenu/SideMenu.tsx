import { USE_CASES } from "../../helpers/constants";
import styles from "./SideMenu.module.css";
import { CiCircleInfo } from "react-icons/ci";

type SideMenuProps = {
  activeUseCase: USE_CASES;
  onCaseSelect: (chatId: USE_CASES) => void;
  isLoading: boolean;
};

const CASE_DESCRIPTION_TEXT = {
  THEME_1:
    "Technical Assistance",
  THEME_2:
    "Project Stock Outs",
  THEME_3:
    "Project Phelps"
} as const;

export const SideMenu = ({
  activeUseCase,
  onCaseSelect,
  isLoading
}: SideMenuProps) => {
  const isUseCase1 = activeUseCase === USE_CASES.THEME_1;
  const isUseCase2 = activeUseCase === USE_CASES.THEME_2;
  const isUseCase3 = activeUseCase === USE_CASES.THEME_3;
  return (
    <aside className={styles.sideMenuContainer}>
      <div>
        <div className={styles.sideMenuHeader}>
          <h2>Themes</h2>
        </div>
        <ul className={styles.chatList}>
          <li
            className={`${styles.menuOption} ${
              isUseCase1 ? styles.activeOption : ""
            } ${isLoading && !isUseCase1 ? styles.disabledOption : ""}`}
            onClick={() =>
              isLoading ? null : onCaseSelect(USE_CASES.THEME_1)
            }
          >
            Technical Assistance
          </li>
          <li
            className={`${styles.menuOption} ${
              isUseCase2 ? styles.activeOption : ""
            } ${isLoading && !isUseCase2 ? styles.disabledOption : ""}`}
            onClick={() =>
              isLoading ? null : onCaseSelect(USE_CASES.THEME_2)
            }
          >
            Project Stock Outs
          </li>
          <li
            className={`${styles.menuOption} ${
              isUseCase3 ? styles.activeOption : ""
            } ${isLoading && !isUseCase1 ? styles.disabledOption : ""}`}
            onClick={() =>
              isLoading ? null : onCaseSelect(USE_CASES.THEME_3)
            }
          >
            Project Phelps
          </li>
        </ul>
      </div>

      <p className={styles.caseDescription}>
        {/* <CiCircleInfo size={14} /> */}

        {CASE_DESCRIPTION_TEXT[activeUseCase]}
      </p>
    </aside>
  );
};
