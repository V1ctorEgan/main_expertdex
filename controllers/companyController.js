const Company = require("../model/Company");

const getAllCompanies = async (req, res) =>{
    const companies = await Company.find();
    console.log(companies);
    
    if (!companies || companies.length === 0) return res.status(204).json({"message": "no Companies found"});
    console.log(companies)
    res.json(companies);
}

const createNewCompanies = async (req, res) => {
    const loggedInUserId = req.userId;
    const { name, address, contactEmail, contactPhone, description, industry, website } = req.body;

     if (!name || !address) {
        return res.status(400).json({'message': 'Name and address are required.' });
    }
    try{
        const result = await Company.create({
            name: name, 
            address: address, 
            contactEmail: contactEmail, 
            contactPhone: contactPhone,
            description: description,
            industry: industry,
            website: website,
            userId: loggedInUserId 
        });
        res.status(201).json(result)
    } catch(err){
        console.error(err)
        if (err.code === 11000) { // MongoDB duplicate key error code
            return res.status(409).json({ message: "Company with this name or user already exists." });
        }
        res.status(500).json({ message: "Error creating company." });
    }
    
}


const updateCompany = async (req, res) => {
   const { name, address, contactEmail, contactPhone, description, industry, website} = req.body;
   const companyId = req.body.id || req.params.id
     if(!companyId) {
        return res.status(400).json({'messages': 'Company ID is required for update.'});
    }
     try {
        // console.log("before find one")
        const company = await Company.findOne({ _id: companyId }).exec();
        console.log(`company : ${company}`)

        if (!company) {
            return res.status(404).json({ "message": `No company matches ID ${companyId}.` });
        }

        // IMPORTANT: Ownership check. A company user should only update their own company.
        // This assumes req.user.id is the ID of the logged-in user.
        // And that company.userId is the ID of the user associated with this company.
        if (req.user && company.userId.toString() !== req.userId && req.accountType !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You can only update your own company profile.' });
        }


        if (name !== undefined) company.name = name; // Use !== undefined to allow empty strings
        if (address !== undefined) company.address = address;
        if (contactEmail !== undefined) company.contactEmail = contactEmail;
        if (contactPhone !== undefined) company.contactPhone = contactPhone;
        if (description !== undefined) company.description = description;
        if (industry !== undefined) company.industry = industry;
        if (website !== undefined) company.website = website;

        const result = await company.save();
        res.json(result);
    } catch (err) {
        console.error(err);
        if (err.code === 11000) { // MongoDB duplicate key error (e.g., if new name is not unique)
            return res.status(409).json({ message: "Company name already exists." });
        }
        res.status(500).json({ message: "Error updating company." });
    }
};

const deleteCompany = async (req, res) => {
     const companyId = req.body.id || req.params.id;
    if (!companyId) return res.status(400).json({ 'message': 'Company ID required.' });

    try {
        const company = await Company.findOne({ _id: companyId }).exec();

        if (!company) {
            return res.status(404).json({ "message": `No company matches ID ${companyId}.` });
        }

        // IMPORTANT: Ownership/Authorization check for deletion
        if (req.user && company.userId.toString() !== req.userId && req.accountType !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own company profile.' });
        }

        const result = await company.deleteOne();
        res.json({ message: `Company ${company.name} with ID ${company._id} deleted successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting company." });
    }
};

const getCompany = async (req, res) => {
    const companyId = req.params.id;
    if (!companyId) return res.status(400).json({ 'message': 'Company ID required.' });

    const company = await Company.findOne({ _id: companyId }).exec();
    if (!company) {
        return res.status(404).json({ "message": `No company matches ID ${req.params.userId}.` });
    }
    res.json(company);
}

module.exports = {
    getAllCompanies,createNewCompanies,updateCompany,deleteCompany,getCompany 
}
