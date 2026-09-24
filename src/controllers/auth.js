//src/controllers/auth.js
import {
    createUser,
    findUserByEmail,
    verifyPassword
} from '../models/users.js';

export function registerPage(req, res) {
    return res.render('register', { title: 'Register', error: null });
}

export function loginPage(req, res) {
    return res.render('login', { title: 'Login', error: null });
}

export async function register(req, res, next) {
    try {
        const { displayName, username, email, password } = req.body;

        if (!displayName || !username || !email || !password) {
            return res.status(400).render('register', {
                title: 'Register',
                error: 'All fields are required.'
            });
        }

        await createUser(displayName, username, email, password);

        return res.redirect('/login?registered=true');
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).render('register', {
                title: 'Register',
                error: 'That email or username is already registered.'
            });
        }

        return next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).render('login', {
                title: 'Login',
                error: 'Invalid email or password.'
            });
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);

        if (!passwordMatches) {
            return res.status(401).render('login', {
                title: 'Login',
                error: 'Invalid email or password.'
            });
        }

        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            displayName: user.displayName,
            role: user.role.name
        };

        return res.redirect('/');
    } catch (error) {
        return next(error);
    }
}

export function logout(req, res, next) {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        return res.redirect('/');
    });
}

export function adminDashboardPage(req, res) {
    return res.render('admin/dashboard', { title: 'Admin Dashboard' });
}