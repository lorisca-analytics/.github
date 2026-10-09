<img src="./hero.svg" alt="Analytics Work — Work that shows its mechanism." width="100%">

<p>The through-line across everything here: the obvious metric points one way, the mechanism underneath points the other.</p>

---

## All repos

<!-- REPOS:START -->
- [bike-venture-turnaround](https://github.com/lorisca-analytics/bike-venture-turnaround) - **The Bounce-Back** — A marketing performance audit that pulled a team out of a Q3 collapse and back to profitability by Q6.
- [delivery-economics-dashboard](https://github.com/lorisca-analytics/delivery-economics-dashboard) - **Delivery Economics** — A white-glove delivery operation losing $1,156 on 13 orders.
- [h1b-sponsorship-sql-analysis](https://github.com/lorisca-analytics/h1b-sponsorship-sql-analysis) - **Which Employers Reliably Sponsor H-1B Business Roles** — SQL analysis of 3.47M H-1B filings (2020–2023).
- [massachusetts-h1b-analysis](https://github.com/lorisca-analytics/massachusetts-h1b-analysis) - **Massachusetts H-1B Analysis** — Reading the Massachusetts labor market through five years of public H-1B filing data: which employers sponsor repeatedly, and do business roles pay as well as analytics roles?
- [superstore-discount-ceiling](https://github.com/lorisca-analytics/superstore-discount-ceiling) - **Where Should We Spend the Next Ad Dollar?** — A marketing analytics lead has an ad budget and a room full of managers who read the business through sales volume.
<!-- REPOS:END -->

---

## Shipped

<!-- SHIPPED:START -->
<table>
<tr>
<td width="60%" valign="top">

`TALENT SYSTEMS`

### Which Employers Reliably Sponsor H-1B Business Roles

SQL analysis of 3.47M H-1B filings (2020–2023). The business-role wage premium survives on medians — then breaks honestly when IT managers are excluded.

**3.47M filings · 8 queries**

[Repo](https://github.com/lorisca-analytics/h1b-sponsorship-sql-analysis) · [All case studies](https://lorisca-analytics.github.io)

</td>
<td width="40%" valign="top">
<img src="https://raw.githubusercontent.com/lorisca-analytics/h1b-sponsorship-sql-analysis/main/visuals/02-wage-premium-by-year.png" alt="Wage premium by year, business vs data roles" width="100%">
</td>
</tr>
<tr>
<td width="60%" valign="top">

`ANALYTICS & MODELS`

### Where Should We Spend the Next Ad Dollar?

A marketing analytics lead has an ad budget and a room full of managers who read the business through sales volume. This dashboard makes the case for spending it elsewhere, and lets the room test the recommendation live.

**9,994 order lines · 20% discount ceiling**

[Repo](https://github.com/lorisca-analytics/superstore-discount-ceiling) · [Tableau Public](https://public.tableau.com/app/profile/lorisca.cessia.tuuk/viz/A1_EXTRACT_v3/Story1) · [Interactive dashboard](https://lorisca-analytics.github.io/superstore-discount-ceiling/dashboard/) · [All case studies](https://lorisca-analytics.github.io)

</td>
<td width="40%" valign="top">
<img src="https://raw.githubusercontent.com/lorisca-analytics/superstore-discount-ceiling/main/assets/dashboard.png" alt="Where Should We Spend the Next Ad Dollar?: cover visual" width="100%">
</td>
</tr>
<tr>
<td width="60%" valign="top">

`STRATEGY & OPERATIONS`

### Delivery Economics

A white-glove delivery operation losing $1,156 on 13 orders. I rebuilt the whole case from 171 raw order lines: the cost model, the 7-day operating schedule, and the operating system that runs the day.

**171 order lines · 7-day schedule**

[Repo](https://github.com/lorisca-analytics/delivery-economics-dashboard) · [Presentation](https://lorisca-analytics.github.io/delivery-economics-dashboard/) · [Dashboard](https://lorisca-analytics.github.io/delivery-economics-dashboard/dashboard.html) · [Operations design](https://lorisca-analytics.github.io/delivery-economics-dashboard/operations.html) · [All case studies](https://lorisca-analytics.github.io)

</td>
<td width="40%" valign="top">
<img src="https://raw.githubusercontent.com/lorisca-analytics/delivery-economics-dashboard/main/docs/cover.svg" alt="Delivery Economics: cover visual" width="100%">
</td>
</tr>
<tr>
<td width="60%" valign="top">

`STRATEGY & OPERATIONS`

### The Bounce-Back

A marketing performance audit that pulled a team out of a Q3 collapse and back to profitability by Q6.

**6 quarters · −$360K to +$703K**

[Repo](https://github.com/lorisca-analytics/bike-venture-turnaround) · [All case studies](https://lorisca-analytics.github.io)

</td>
<td width="40%" valign="top">
<img src="https://raw.githubusercontent.com/lorisca-analytics/bike-venture-turnaround/main/charts/chart1_profit_turnaround.png" alt="Operating profit by quarter" width="100%">
</td>
</tr>
</table>
<!-- SHIPPED:END -->

---

## Featured walkthrough

<table>
<tr>
<td width="60%" valign="top">

`ANALYTICS & MODELS` `PYTHON`

### Reading the Massachusetts labor market through H-1B filings

I'm on an F-1 visa. Finding the right role isn't the whole job search — I need an employer who'll go the full distance: OPT → STEM OPT → H-1B. So I read 137,866 Massachusetts H-1B filings (FY2020–2024) and asked: do the business roles I'd apply to get sponsored as often, and pay as well, as the data-and-analytics roles my visa plan leans on?

**The answer:** 13,672 vs 14,035 filings. $105,000 vs $104,000 median pay — statistically the same. 0% vs 100% STEM — the H-1B clock is tighter on the business side.

**The correction:** an earlier version reported $115,000 for the business median — 2,583 IT managers had slipped into the business group through their occupation code. Re-ran without them: $105,000. The notebook shows exactly what changed.

**The walkthrough:**
1. **Load** the Massachusetts disclosure file — 137,866 rows.
2. **Filter** to certified H-1B filings — 123,497 rows.
3. **Normalize** every wage to annual; report medians (typo'd pay units make averages meaningless).
4. **Group** by government occupation codes, not keyword matching — and pull the IT managers back out.
5. **Compare** with one groupby, plus bootstrap confidence intervals on the medians.

[Repo](https://github.com/lorisca-analytics/massachusetts-h1b-analysis) · [10-min video walkthrough](https://www.youtube.com/watch?v=SEite--Lkh4) · [Notebook](https://github.com/lorisca-analytics/massachusetts-h1b-analysis/blob/main/notebooks/h1b_ma_analysis.ipynb)

</td>
<td width="40%" valign="top">
<a href="https://www.youtube.com/watch?v=SEite--Lkh4"><img src="https://img.youtube.com/vi/SEite--Lkh4/maxresdefault.jpg" alt="Video walkthrough: H-1B Massachusetts FY2020-2024 analysis" width="100%"></a>
</td>
</tr>
</table>

---

## The lanes

<!-- LANES:START -->
<table>
<tr>
<td width="50%" valign="top">

`TALENT SYSTEMS`

Hiring, retention, and workforce data.

**1 shipped** · 4 in the pipeline

</td>
<td width="50%" valign="top">

`ANALYTICS & MODELS`

SQL, machine learning, and BI — built to support one decision, with limits stated.

**2 shipped** · 6 in the pipeline

</td>
</tr>
<tr>
<td width="50%" valign="top">

`STRATEGY & OPERATIONS`

Business cases, pricing, and delivery — the numbers behind the story.

**2 shipped** · 7 in the pipeline

</td>
<td width="50%" valign="top">

`CONSULTING`

Live-client engagements — real stakeholders, real constraints. Team-based consulting work with deliverables, distinct from solo analyses.

**2 in the pipeline**

</td>
</tr>
</table>
<!-- LANES:END -->

---

<details>
<summary><b>In the pipeline</b> — works in progress, real titles, no filler</summary>

<br>

<!-- PIPELINE:START -->
**Talent Systems**
- Cleaning a visa dataset without deleting the signal
- The recruitment single source of truth (Bank Mega)
- Attrition was a promotion problem
- Making a gender-gap contradiction visible

**Analytics & Models**
- Predicting income bracket, and knowing when to stop
- Where a vaccine supply strategy should point
- A board bonus that looked already lost
- A sales peak that was not growth
- Forecasting a seasonal business three ways
- Testing a straight-line forecast against reality

**Strategy & Operations**
- Two identical-looking tech giants with opposite economics
- Cost of capital for a company that barely borrows
- Whether a Chilean neobank is actually revolutionary
- A brand that outgrew its own positioning
- Auditing an AI transformation pitch as the person funding it
- Scoring a hardware launch before planning it
- Designing a scorecard for a firm that only measured revenue

**Consulting**
- M&T Bank — live-client engagement (D1–D6 deliverables)
- Autodesk AutoProc — LATAM procurement strategy
<!-- PIPELINE:END -->

</details>

---

<p align="center">
<a href="https://lori-sca.github.io">Personal site</a> ·
<a href="https://lorisca-analytics.github.io">Analytics Work</a> ·
<a href="https://lorisca-builds.github.io">Builds</a> ·
<a href="mailto:loriscatuuk@gmail.com">Email</a> ·
<a href="https://www.linkedin.com/in/lorisca">LinkedIn</a> ·
<a href="https://github.com/lorisca-analytics">GitHub</a>
</p>
