const validateTestDates = (req, res, next) => {
    const { testStartDate, testEndDate } = req.body;
    
    if (testStartDate && testEndDate) {
        const start = new Date(testStartDate);
        const end = new Date(testEndDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return next(new ErrorHandler("Invalid date format", 400));
        }
        
        if (end <= start) {
            return next(new ErrorHandler("End date must be after start date", 400));
        }
    }
    next();
};

// Use in route
router.post('/job/:jobId/test/:testId', validateTestDates, addTestToJob);