import {
  category,
  type Action,
  type AirData,
  type Location,
  type Profile,
} from "../../shared/domain";
import { CommunityPage } from "../pages/CommunityPage";
import { DailyPlanPage } from "../pages/DailyPlanPage";
import { HealthyHomePage } from "../pages/HealthyHomePage";
import { ImpactPage } from "../pages/ImpactPage";
import { OverviewPage } from "../pages/OverviewPage";
import type { Page } from "../types";

interface PageContentProps {
  page: Page;
  air: AirData;
  location: Location;
  profile: Profile;
  airBusy: boolean;
  loadAir: () => Promise<void>;
  setModal: (value: "sources") => void;
  changePage: (page: Page) => void;
  plan: Action[];
  completed: string[];
  toggleAction: (id: string) => void;
  exportPlan: () => void;
  sendMessage: (text: string) => Promise<void>;
  savings: number;
  pledges: string[];
  setPledges: (updater: (previous: string[]) => string[]) => void;
}
export function PageContent({
  page,
  air,
  location,
  profile,
  airBusy,
  loadAir,
  setModal,
  changePage,
  plan,
  completed,
  toggleAction,
  exportPlan,
  sendMessage,
  savings,
  pledges,
  setPledges,
}: PageContentProps) {
  const status = category(air.aqi);
  const chartMax = Math.max(400, ...air.hours.map((h) => h.aqi));
  return (
    <>
      {page === "Overview" && (
        <OverviewPage
          loadAir={loadAir}
          airBusy={airBusy}
          air={air}
          location={location}
          status={status}
          setModal={setModal}
          chartMax={chartMax}
          changePage={changePage}
          plan={plan}
          completed={completed}
          toggleAction={toggleAction}
          profile={profile}
        />
      )}
      {page === "My daily plan" && (
        <DailyPlanPage
          location={location}
          air={air}
          exportPlan={exportPlan}
          completed={completed}
          plan={plan}
          toggleAction={toggleAction}
          profile={profile}
        />
      )}
      {page === "Healthy home" && (
        <HealthyHomePage
          sendMessage={sendMessage}
          profile={profile}
          setModal={setModal}
        />
      )}
      {page === "My impact" && (
        <ImpactPage
          completed={completed}
          savings={savings}
          pledges={pledges}
          plan={plan}
          profile={profile}
        />
      )}
      {page === "Community" && (
        <CommunityPage pledges={pledges} setPledges={setPledges} />
      )}
    </>
  );
}
