const verifyRoles = (allowedRoles) => {

    return (req, res, next)=>{
        // console.log(req);
        if (!req?.accountType) return res.sendStatus(401);
        // const rolesArray = [...allowedRoles];
        const rolesArray = allowedRoles
        console.log(rolesArray)
        console.log(req.accountType);
        
        // const result = req.accountType.map(role => rolesArray.includes(role)).find(val => val === true);
        const hasPermission = rolesArray.includes(req.accountType);
        if (!hasPermission) {
            console.log('Access Denied: User account type not allowed.');
            return res.sendStatus(403); // Forbidden (authenticated but not authorized)
        }
        // if (!result) return res.sendStatus(401);
        next();
    }
}

module.exports = verifyRoles