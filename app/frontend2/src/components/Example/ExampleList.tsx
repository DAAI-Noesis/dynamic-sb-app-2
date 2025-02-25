import { THEMES } from "../../helpers/constants";
import { Example } from "./Example";

import styles from "./Example.module.css";

// const DEFAULT_EXAMPLES: string[] = [
//     "What is included in my Northwind Health Plus plan that is not in standard?",
//     "What happens in a performance review?",
//     "What does a Product Manager do?"
// ];

const DEFAULT_EXAMPLES = {
    [THEMES.THEME_1]: [
        "Whats the main goal of AT",
        "What about Market Tests?",
        "What is the associated model and what is being done?"
    ],
    [THEMES.THEME_2]: [
        "What is the goal of Project Stock Outs?",
        "How works the data processing?",
        "Whats the KPIs of the project?"
    ],
    [THEMES.THEME_3]: [
        "what is the source, what data and what is it used for?",
        "Where i can find the dashboard of Phelps?",
        "What are the open Themes ? "
    ]
};

const GPT4V_EXAMPLES: string[] = [
    "Compare the impact of interest rates and GDP in financial markets.",
    "What is the expected trend for the S&P 500 index over the next five years? Compare it to the past S&P 500 performance",
    "Can you identify any correlation between oil prices and stock market trends?"
];
interface Props {
    onExampleClicked: (value: string) => void;
    useGPT4V?: boolean;
    activeUseCase: THEMES;
}

// export const ExampleList = ({ onExampleClicked, useGPT4V }: Props) => {
//     return (
//         <ul className={styles.examplesNavList}>
//             {(useGPT4V ? GPT4V_EXAMPLES : DEFAULT_EXAMPLES).map((question, i) => (
//                 <li key={i}>
//                     <Example text={question} value={question} onClick={onExampleClicked} />
//                 </li>
//             ))}
//         </ul>
//     );
// };

export const ExampleList = ({
    onExampleClicked,
    useGPT4V,
    activeUseCase
}: Props) => {
    return (
        <ul className={styles.examplesNavList}>
            {(useGPT4V ? GPT4V_EXAMPLES : DEFAULT_EXAMPLES[activeUseCase]).map(
                (question, i) => (
                    <li key={i}>
                        <Example
                            text={question}
                            value={question}
                            onClick={onExampleClicked}
                    />
                    </li>
                )
            )}
        </ul>
    );
};
