import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMySubscription } from "../api/subscriptionApi";

export default function SubscriptionGuard({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "active" | "required"

  useEffect(() => {
    let mounted = true;
    getMySubscription()
      .then((res) => {
        if (!mounted) return;
        const s = res.data.status;
        setStatus(s === "Active" ? "active" : "required");
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus("required");
        console.error("SubscriptionGuard fetch error:", err);
      });
      
    return () => {
        mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-gray-500 font-medium">Đang kiểm tra gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  if (status === "required") {
    return <Navigate to="/owner/service-packages" state={{ forced: true }} replace />;
  }

  return children;
}
