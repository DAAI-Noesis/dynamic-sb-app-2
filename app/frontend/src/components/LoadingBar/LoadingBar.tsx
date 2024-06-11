import styles from "./LoadingBar.module.css";

type LoadingBarProps = {
  progress: number;
};

export const LoadingBar = ({ progress }: LoadingBarProps) => {
  return (
    <div className={styles.loadingBarContainer}>
      <p style={{ textAlign: "center" }}>
        {progress !== 100
          ? "Loading content..."
          : "File downloaded successfully!"}
      </p>
      <div className={styles.barOutsideContent}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
