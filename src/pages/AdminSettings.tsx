import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManageSubscriptionPlans } from "./ManageSubscriptionPlans";

export const AdminSettings = () => {
    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <ManageSubscriptionPlans />
            </div>
        </DashboardLayout>
    );
};
