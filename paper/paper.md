---
title: "THE INTERSTELLAR SIGNATURE: A COMPUTATIONAL FRAMEWORK FOR OPEN SOURCE INTERSTELLAR TRACKING"
authors:
  - name: Pancha Narayan Sahu
    orcid: 0009-0003-7618-7588
    affiliation: Independent Researcher,Nexus Cosmos,Nepal
version: "v1.0.0"
doi: 10.5281/zenodo.17470252
repository: https://github.com/TheVishalKumar369/The-Interstellar-Signature
archive: https://doi.org/10.5281/zenodo.17470252
---

**Interstellar Signature** serves as a bridge between raw, unstructured astronomical data and an intuitive, developer-friendly interface. This framework integrates live astronomical data from public repositories and APIs with physics-based simulation techniques to model and visualize the motion of both solar system and interstellar objects in real time. The platform provides interactive visualizations, comparative analysis of interstellar and solar system objects, and modular tools that allow users to explore, modify, and extend the framework for their own research purposes.

### Statement of need

Interstellar objects, such as 1I/‘Oumuamua and 2I/Borisov, offer a unique window into the formation and evolution of other star systems, yet tracking and analyzing their trajectories remains largely restricted to specialized institutions. Interstellar and solar system datasets are often large, complex, and difficult to navigate, limiting their usability for developers, researchers, and enthusiasts. To address this, we present The Interstellar Signature: A Computational Framework for Open-Source Interstellar Tracking, implemented through a web-based platform.

### Features
- Interactive 3D visualization of solar system and interstellar object trajectories  
- Real-time data integration from public APIs (MPC, JPL Horizons)  
- Modular tools for extension and customization by developers  
- GUI-based interface; no command-line interaction required  
- Part of the **NexusCosmos** ecosystem for space science education and research

### Future work
Future extensions will incorporate AI-driven modules for trajectory prediction, anomaly detection, and enhanced visualization. By combining open-source accessibility, computational rigor, and interactive simulation, Interstellar Signature democratizes interstellar tracking, making advanced space research available to a broader scientific and educational community. This framework represents a step toward bridging professional astronomical research and public engagement through technology.

### Acknowledgements

The author extends sincere gratitude to the NASA Jet Propulsion Laboratory (JPL) [@jpl2025] for providing open access to the Horizons ephemeris system, which served as a primary data source for this study and MPC [@mpc2025] for the metadata of the objects. Appreciation is also expressed to the Planetary Data System (PDS) [@pds2025] team for maintaining publicly available archives that enabled the integration of physical and discovery metadata for interstellar objects. The author acknowledges the support of open-source software contributors whose tools—particularly Python [python2025], FastAPI [fastapi2025], and Three.js [threejs2025]—were instrumental in the development of the computational and visualization frameworks used in this research.The software leverages datasets from the Planetary Data System [@pds2025] and Gaia Archive [@esa2025], and visualization tools such as NASA Eyes [@nasaeyes2025], Celestia [@celestia2025], and SpaceEngine [@spaceengine2025].

Finally, the author recognizes the importance of open data and collaborative science communities that continue to advance public engagement and understanding of interstellar research.

### References

If you refer to other tools, papers, or libraries in your text, list them here in a simple numbered format, e.g.:

1. Smith A, Jones B. (2023). A related tool for…  
2. Doe C. (2022). Another relevant library…

### Implementation and architecture

Clone the repository:

```bash
git clone https://github.com/TheVishalKumar369/3I_ATLAS.git
cd 3I_ATLAS
```

Install the backend dependencies

```bash
pip install -r requirements.txt
```

Install the frontend dependencies

```bash
cd frontend
npm install
cd ..
```

Run the backend server

```bash
uvicorn main:app --reload
```

Run the frontend server

```bash
cd frontend
npm run dev
```

![Perihelion of the 3I/ATLAS](figures/perihelion.png)
*Figure 1: Perihelion positions of interstellar object 3I/ATLAS simulated in The Interstellar Signature.*

![Graphs comparison of the Interstellar Objects](figures/graphs-comparisson.png)
*Figure 2: Comparison of velocities and distance of interstellar objects.*

# Software

The software developed for this work, Interstellar Signature v1.0.0 [@InterstellarSignature2025], is open-source and archived at Zenodo.

