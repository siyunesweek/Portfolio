# Siyuan's Personal Portfolio

Welcome to the repository of my personal portfolio! This is a simple, self-hosted website where you can have fun with bubbles draggin them or shaking them with your phone.

## Built With

This portfolio site is a static site directly generated from data and templates.

- **[Eleventy (11ty)](https://www.11ty.dev/)** - A static site generator.
- **HTML, CSS, Vanilla JS** - For the structure, styling, and custom interactive UI (such as the physics of the draggable bubbles).
- **Node.js** - Package and build management.

---

## Getting Started

If you want to run this project locally, simply follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) with npm installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/siyunesweek/Portfolio.git
   ```
2. Navigate into the project directory:
   ```bash
   cd portfolio
   ```
3. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Running Locally
To start the local development server (which includes live-reloading as you make changes), run:
```bash
npm run dev
```

### Build for Production
To generate the static HTML files (they will be placed inside the `_site` directory):
```bash
npm run build
```

> There is a deploy.sh that automate the process of build and deploying.
> You just need to create the .env with the variables used in deploy.sh

---

## Project Structure Highlights
- `/data` - JSON configurations storing information about the site and the interactive bubbles (`site.json`, `bubbles.json`).
- `/public` - Static assets including CSS styles and the vanilla JS (`bubbles.js`) powering the core physics/animations.
- `package.json` - Node scripts (`npm run dev`, `npm run build`) and Eleventy dependencies.
- `deploy.sh` - Shell script used for my specific server deployments.
- `physics.js` - where all the physics releated to the bubbles are located

---

Feel free to explore the repository, or reach out to me! ʕ•́ᴥ•̀ʔっ
