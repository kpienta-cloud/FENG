# FENG — In Memory of Felix Y. Feng, MD (1975–2024)

Materials prepared for the Feng Symposium on Prostate Cancer Revolutions keynote, **"Transformative Science and the Big Questions Shaping the Future of Prostate Cancer,"** delivered by Kenneth J. Pienta, MD (The Johns Hopkins University School of Medicine).

Felix Y. Feng, MD was a radiation oncologist and translational prostate cancer researcher at UCSF (and previously the University of Michigan) who died of cancer on December 10, 2024, at age 48. This repository holds the research, writing, and visualization built to honor his scientific legacy.

## Contents

- **`website/`** — "The Feng Corpus," an interactive knowledge graph built from 451 of Felix Feng's PubMed-indexed publications. Open `website/index.html` locally, or deploy the folder as a static site. Data lives in `website/data/*.json`.
- **`paper/`** — The companion Perspective manuscript for *The Prostate*, "Transformative Science and the Big Questions Shaping the Future of Prostate Cancer," in `.docx`, `.pdf`, and plain-text form, with a full reference list of primary sources.
- **`slides/`** — The 45-minute keynote deck (`.pptx`, 34 slides with speaker notes) delivered at the symposium.
- **`data/`** — Raw and processed research data: the PubMed extraction (`feng_pubs_tagged.json`), the knowledge-graph node/edge data (`graph_data.json`), publication timeline (`timeline_data.json`), landmark-paper index (`landmark_papers.json`), and a fully source-cited research dossier on Feng's career (`feng_deep_research.md`).

## Methodology

Publication data was pulled directly from the National Library of Medicine's PubMed database via the E-utilities API (query: `Feng FY[Full Author Name]`), filtered to English-language records whose affiliations or subject matter matched radiation oncology, genitourinary oncology, or prostate cancer, to exclude unrelated authors who share the same name and initials. Research themes were assigned by matching each paper's title, abstract, MeSH terms, and keywords against a curated set of terms spanning molecular discovery, precision medicine, and clinical translation. Every factual claim in the deep-research dossier and the Perspective paper is tied to a specific, cited, publicly accessible source.

## Live site

The interactive knowledge graph is also deployed at: https://kpienta-cloud.github.io/FENG/
