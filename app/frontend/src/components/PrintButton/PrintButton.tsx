// import React from "react";
// import { useReactToPrint } from "react-to-print";
// import { Button } from "@fluentui/react-components";
// import { Print24Regular } from "@fluentui/react-icons";

// type PrintButtonProps = {
//   chatRef: React.RefObject<HTMLDivElement>;
//   disabled: boolean;
// };

// export default function PrintButton({ chatRef, disabled }: PrintButtonProps) {
//   const handlePrint = useReactToPrint({
//     content: () => chatRef?.current || null,
//     documentTitle: "SUPERBOCK-AI chat conversation",
//     onBeforePrint: () => console.log("before printing..."),
//     onAfterPrint: () => console.log("after printing..."),
//     removeAfterPrint: true
//   });

//   return (
//     <div>
//       <Button
//         icon={<Print24Regular />}
//         onClick={handlePrint}
//         disabled={disabled}
//       >
//         Print chat
//       </Button>
//     </div>
//   );
// }
