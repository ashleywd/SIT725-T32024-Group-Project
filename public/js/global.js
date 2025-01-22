import { toggleUnnecessaryMenu } from "./navbar.js";

const initializeMaterializeComponent = () => {
  // Initialize Materialize components
  const selects = document.querySelectorAll("select");
  M.FormSelect.init(selects);

  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  const sidenav = document.querySelectorAll(".sidenav");
  M.Sidenav.init(sidenav);
};

const verifyUserAuthentication = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  // Actions for when users are authenticated
  toggleUnnecessaryMenu();
};

const clearTokenAndRedirectToLogin = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

const getStatusColor = (status) => {
  const colors = {
    open: "blue",
    accepted: "orange",
    completed: "green",
    cancelled: "red",
  };
  return colors[status] || "grey";
};

const resetScreenPosition = () => {
  const scrollPosition = window.scrollY;
  window.scrollTo(0, scrollPosition);
};

const updatePointsDisplay = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/account/points", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await response.json();
    const pointsElement = document.getElementById("userPoints");
    if (pointsElement) {
      pointsElement.textContent = data.points;
    }
  } catch (error) {
    console.error("Error fetching points:", error);
  }
};

const getPostById = async (postId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/posts/${postId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch post");
    }

    const post = await response.json();
    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    M.toast({ html: "Failed to fetch post", classes: "red" });
    throw error;
  }
};

const getStatusActions = (post, dateTime) => {
  const statusKey = `${post.status}_${post.type}`;

  const actions = {
    created_offer: {
      creatorMessage: `You have created a new offer post for ${dateTime}.`,
      acceptorMessage: null,
      pointsUpdate: null,
    },

    created_request: {
      creatorMessage: `You have created a new request post for ${dateTime}. ${post.hoursNeeded} points have been deducted.`,
      acceptorMessage: null,
      pointsUpdate: {
        amount: -post.hoursNeeded,
        recipient: post.postedBy,
        reason: "babysitting request",
      },
    },

    edit_offer: {
      creatorMessage: `You have updated your babysitting offer for ${dateTime}.`,
      acceptorMessage: post.acceptedBy
        ? `A babysitting offer you accepted for ${dateTime} has been modified.`
        : null,
      pointsUpdate: null, // No points change for editing offers
    },

    edit_request: {
      creatorMessage: `You have updated your babysitting request for ${dateTime}.${
        post.pointDifference !== 0
          ? ` ${Math.abs(post.pointDifference)} points have been ${
              post.pointDifference > 0 ? "deducted" : "refunded"
            }.`
          : ""
      }`,
      acceptorMessage: post.acceptedBy
        ? `A babysitting request you accepted for ${dateTime} has been modified.`
        : null,
      pointsUpdate: post.pointDifference
        ? {
            amount: -post.pointDifference,
            recipient: post.postedBy,
            reason:
              post.pointDifference > 0
                ? "updating your babysitting request"
                : "reducing hours in your babysitting request",
          }
        : null,
    },

    accepted_offer: {
      creatorMessage: `Your babysitting offer for ${dateTime} has been accepted.`,
      acceptorMessage: `You have accepted a babysitting offer for ${dateTime}. ${post.hoursNeeded} points will be deducted from your account.`,
      pointsUpdate: {
        amount: -post.hoursNeeded,
        recipient: post.acceptedBy,
        reason: "accepting a babysitting offer",
      },
    },

    accepted_request: {
      creatorMessage: `Your request for a babysitter on ${dateTime} has been accepted.`,
      acceptorMessage: `You have accepted to provide babysitting on ${dateTime}.`,
      pointsUpdate: null,
    },

    completed_offer: {
      creatorMessage: `Your babysitting offer for ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`,
      acceptorMessage: `The babysitting offer you accepted for ${dateTime} has been completed.`,
      pointsUpdate: {
        amount: post.hoursNeeded,
        recipient: post.postedBy,
        reason: "completing your babysitting offer",
      },
    },

    completed_request: {
      creatorMessage: `Your babysitting request for ${dateTime} has been completed.`,
      acceptorMessage: `The babysitting session you provided on ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`,
      pointsUpdate: {
        amount: post.hoursNeeded,
        recipient: post.acceptedBy,
        reason: "completing the babysitting session",
      },
    },

    cancelled_offer: {
      creatorMessage: `You have cancelled your babysitting offer for ${dateTime}.`,
      acceptorMessage: post.acceptedBy
        ? `The babysitting offer you accepted for ${dateTime} has been cancelled. ${post.hoursNeeded} points have been refunded to your account.`
        : null,
      pointsUpdate: post.acceptedBy
        ? {
            amount: post.hoursNeeded,
            recipient: post.acceptedBy,
            reason: "cancelled babysitting offer refund",
          }
        : null,
    },

    cancelled_request: {
      creatorMessage: `Your babysitting request for ${dateTime} has been cancelled. ${post.hoursNeeded} points have been refunded to your account.`,
      acceptorMessage: post.acceptedBy
        ? `A babysitting request you accepted for ${dateTime} has been cancelled.`
        : null,
      pointsUpdate: {
        amount: post.hoursNeeded,
        recipient: post.postedBy,
        reason: "cancelled babysitting request refund",
      },
    },
  };

  return (
    actions[statusKey] || {
      creatorMessage: null,
      acceptorMessage: null,
      pointsUpdate: null,
    }
  );
};

export {
  initializeMaterializeComponent,
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
  resetScreenPosition,
  updatePointsDisplay,
  getPostById,
  getStatusActions,
};
