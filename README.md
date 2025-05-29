<div align="center">

![version](https://img.shields.io/badge/Version-1.0.0-blue)
[![GitHub issues](https://img.shields.io/github/issues/shahkoorosh/Concave-Building?color=red)](https://github.com/shahkoorosh/Concave-Building/issues)
[![GitHub Repo stars](https://img.shields.io/github/stars/shahkoorosh/Concave-Building?style=social)](https://github.com/shahkoorosh/Concave-Building/stargazers)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black.svg?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![YouTube](https://img.shields.io/badge/YouTube-Subscribe-red?logo=youtube&logoColor=white)](https://www.youtube.com/@UD.SMedia)

# Conceptual Concave Building

This application is designed as a creative tool, especially for users working with AI image generation platforms like **ComfyUI** or any system that utilizes **ControlNet segmentation models**.

</div>

<br>
<br>

**The Core Idea:**

The main goal is to help you create **segmentation maps** for conceptual architectural designs. You do this by:

1.  **Placing Basic Shapes:** Add simple shapes (rectangles, circles, triangles) of different sizes onto the canvas. These shapes represent elements like windows, doors, or structural components.
2.  **Forming a Building Outline:** As you add shapes, a larger polygon automatically wraps around them, representing the main building structure.
3.  **Using Specific Colors:** You can color these shapes and other elements (sky, ground). The key is that these colors are chosen to be recognizable by ControlNet segmentation models (like those using the "UniFormer Segmentor" preprocessor). This allows you to tell the AI exactly what each part of your design represents (e.g., a blue shape for a window, a green area for trees on the ground). The app includes predefined color presets that work well with these models.

**How You Can Use It:**

* **Generate Segmentation Maps:** Design your scene in this app, then click "Save Image." This saved image acts as a detailed map for ControlNet.
* **Load into AI Platforms:** Take your saved image and load it into ComfyUI (or similar platforms) as an input for your ControlNet segmentor model. The AI will then generate a final image based on the structure and color-coded segments you designed.
* **Real-time Generation (Advanced):** For ComfyUI users, this app can potentially be used with custom nodes (like Mixlab's) that support real-time image generation using technologies like LCM LoRa, allowing you to see your conceptual building come to life instantly as you design.

In short, this app bridges the gap between simple 2D conceptual design and complex AI image generation, giving you more precise control over your architectural outputs.

## How to Use the App (The Fun Part!)

Once the app is running (see instructions below if you're a developer):

1.  **Look at the left panel:** This is where you control everything.
2.  **Select Shape Types:** Check the boxes (Rectangle, Circle, Triangle) for the shapes you want to use. The app will cycle through these when you add new ones.
3.  **Click on the Canvas:**
    * **Left-click** to place a shape.
    * **Left-click and drag** a shape to move it.
    * **Right-click** a shape to delete it.
4.  **Play with Colors & Sizes:** Use the sliders and color pickers in the left panel to change how your building and scene look.
    * "Window" is the default color for new shapes.
    * "Window Sel" changes the color of a shape you've clicked on.
5.  **Save Your Masterpiece:** Click the "Save Image" button.
6.  **Start Over:** Click "Clear" to empty the canvas.

---

## Setting Up and Running

If you want to run this project locally or modify the code, here’s how:

### What You Need:

* **Node.js:** This is the environment that runs the application. You can download it from [nodejs.org](https://nodejs.org/).
* **pnpm (Recommended):** This project uses `pnpm` to manage software packages. After installing Node.js, open your terminal and type:
    ```bash
    npm install -g pnpm
    ```
    (Alternatively, you can try using `npm` or `yarn` if you prefer, but `pnpm` is set up for this project).

### Get the Code:

1.  **Download or Clone:**
    * If you have Git: `git clone https://github.com/shahkoorosh/Concave-Building`
    * Or download the project ZIP from GitHub and extract it.
2.  **Go into the project folder:**
    ```bash
    cd Concave-Building
    ```

### Install Software Packages:

Open your terminal in the project folder and run:

```bash
pnpm install
````

This downloads all the necessary bits and pieces the project relies on.

### Run the App:

* First, build the app:
```bash
 pnpm run build
 ```
* Then, start it:
```bash
pnpm run start
 ```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

### Main Technologies Used:

  * Next.js (A React framework)
  * React (For building the user interface)
  * p5.js (For the interactive drawing canvas)
  * Tailwind CSS (For styling)
  * Shadcn UI (For user interface components)

-----

Enjoy creating\!
