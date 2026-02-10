import toast from "react-hot-toast";

// Simple notification sound (Glass Ping)
const notificationSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

export const playNotificationSound = () => {
    try {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(err => console.log("Audio play failed:", err));
    } catch (error) {
        console.error("Error playing sound:", error);
    }
};

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const showNotification = (title, options = {}) => {
    if (Notification.permission === "granted") {
        try {
            const notification = new Notification(title, {
                icon: "/vite.svg",
                badge: "/vite.svg",
                vibrate: [200, 100, 200],
                ...options
            });

            notification.onclick = function () {
                window.focus();
                notification.close();
            };
        } catch (err) {
            console.error("Notification handling error:", err);
            // Fallback to toast if native notification fails
            toast(title, { icon: "🔔" });
        }
    } else {
        // Fallback to toast
        toast(title, { icon: "🔔" });
    }
};
