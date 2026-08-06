import type { components } from "@nextstep/contracts";
import Link from "next/link";

import { ProgressRing } from "./progress-ring";

export function DashboardPrimaryAction({
  athleteId,
  action,
  campaign,
}: {
  athleteId: string;
  action: components["schemas"]["NextAction"];
  campaign: components["schemas"]["CampaignSummary"];
}) {
  return (
    <section
      className="dashboard-hero"
      aria-labelledby="primary-action-title"
      data-primary-action-type={action.type}
    >
      <div>
        <p className="eyebrow">Do this next</p>
        <h2 id="primary-action-title">{action.title}</h2>
        {action.description ? <p>{action.description}</p> : null}
        <div className="button-row dashboard-actions">
          {action.type !== "REST" ? (
            <Link className="button button-primary" href={action.destination}>
              {action.ctaLabel} <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          <Link
            className={
              action.type === "REST" ? "button button-secondary" : "text-link"
            }
            href={`/athletes/${athleteId}/skill-tree`}
          >
            View pathway
          </Link>
        </div>
      </div>
      <ProgressRing
        value={campaign.progress}
        label={`${campaign.name} pathway`}
      />
    </section>
  );
}
