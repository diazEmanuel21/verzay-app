"use client";

import { CrmFollowUpRulesPanel } from "./CrmFollowUpRulesPanel";

export const MainCrmRules = ({ userId }: { userId: string }) => {
    return <CrmFollowUpRulesPanel userId={userId} />
};
