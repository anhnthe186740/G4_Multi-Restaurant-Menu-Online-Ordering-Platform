// Role-based access control middleware

export const adminOnly = (req, res, next) => {
    // This middleware must be used AFTER verifyToken
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "Admin") {
        return res.status(403).json({
            message: "Access denied. Admin role required."
        });
    }

    next();
};

export const restaurantOwnerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "RestaurantOwner") {
        return res.status(403).json({
            message: "Access denied. Restaurant Owner role required."
        });
    }

    next();
};

export const branchManagerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "BranchManager") {
        return res.status(403).json({
            message: "Access denied. Branch Manager role required."
        });
    }

    next();
};
