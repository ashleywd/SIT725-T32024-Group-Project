import pointsService from "./services/points.js";

const updatePointsDisplay = async () => {
  try {
    const userToken = localStorage.getItem("token");
    if (!userToken) return;

    const data = await pointsService.getPoints();
    const pointsDisplay = document.querySelectorAll("#pointsBadge");
    pointsDisplay[0].textContent = data;
  } catch (error) {
    console.error("Error fetching points:", error);
  }
};

export {
  updatePointsDisplay,
};
