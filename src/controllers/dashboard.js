const dashboardPage = (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.user
    });
};

export { dashboardPage };
