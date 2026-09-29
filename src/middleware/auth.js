//src/middleware/auth.js

export const loadSessionUser = (req, res, next) => {
    req.user = req.session.user || null;
    res.locals.user = req.user;
    next();
};

const isLoggedIn = (req) => Boolean(req.user);
const hasRole = (req, role) => req.user.role === role;

export const requireApiLogin = (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    return next();
};

export const requirePageLogin = (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    return next();
};

export const requireApiRole = (role) => (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    if (!hasRole(req, role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
};

export const requirePageRole = (role) => (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    if (!hasRole(req, role)) {
        const err = new Error('Forbidden');
        err.status = 403;
        return next(err);
    }
    return next();
};