import { createHashRouter, RouterProvider } from "react-router-dom";
import Layout from "./pages/layout/Layout";

const AppRouter = () => {
    const router = createHashRouter([
        {
        path: "/",
        element: <Layout />,
        children: [
            {
            path: "*",
            lazy: () => import("./pages/NoPage")
            }
        ]
        }
    ]);

    return <RouterProvider router={router} />;
};

export default AppRouter;
