const RecentQuestions = require("../../../models/college/qb/RecentQuestions");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");



// =========================================================================================================================================
// ===================================================| get All Recent Question |===================================================================

const getAllRecentQuestions = catchAsyncErrors(async (req, res, next) => {
    const recentQuestions = await RecentQuestions.find({
        createdBy: req.user.id,
    }).limit(5).sort({ createdAt: -1 });

    // console.log(recentQuestions);


    const topics = recentQuestions.map((recentQuestion) => recentQuestion.topics).flat();



    res.status(200).json({
        success: true,

        topics,
    });
});

// ==========================================================================================================================================


// ==========================================================================================================================================
// ===================================================| get Recent Question by ID |==========================================================

const getRecentQuestionById = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const recentQuestion = await RecentQuestions.findById(id);

    if (!recentQuestion) {
        return res.status(404).json({
            success: false,
            message: "Recent Question not found",
        });
    }

    res.status(200).json({
        success: true,
        recentQuestion,
    });
}
);



// ==========================================================================================================================================
// ==========================================================================================================================================
// ===================================================| Delete Recent Question by ID |========================================================

const deleteRecentQuestionById = catchAsyncErrors(async (req, res, next) => {
try {
    const { id } = req.params;
    const {type} = req.query;

    const recentQuestions = await RecentQuestions.find({
        createdBy: req.user.id,
    
    })

    ///console.log(recentQuestions);

//delete the field from the type of question
    // const topics =[
    //     questions : [{},{}],
    //     findAnswer : [{},{}],
    //     code : [{},{}],
    //     video : [{},{}],
    //     essay : [{},{}]
    // ]

    // const topics = recentQuestions.map((recentQuestion) => recentQuestion.topics).flat();

    // topics.filter((topic) => topic._id !== id);
    //     // topic[type] = topic[type].filter((id) => id !== id);


    // console.log(topics);

    //const topics = recentQuestions.map((recentQuestion) => recentQuestion.topics).flat();

    // console.log(recentQuestions[0]?.topics, "topics");


    const filteredTopics = recentQuestions[0]?.topics?.filter((topic) => {
        // console.log(topic._id, "id", id, "type", type);
        return !(topic._id === id && topic.Type === type);
      });
      

//    let arr = filteredTopics.map((topic) => {
//         console.log(topic.Type , "type" , type)
//         // return topic.Type === type && topic._id !== id;
//     });
//     console.log(arr, "arr");

    console.log(filteredTopics.length, "filtered");

    await RecentQuestions.findByIdAndUpdate(recentQuestions[0]._id, {

        topics: filteredTopics,
    });

    res.status(200).json({
        success: true,
    topics:  filteredTopics,
        message: "Recent Question deleted successfully",
    });
} catch (error) {
    console.log(error);
}
}
);


// ============================================================================================================================================


module.exports = {
    getAllRecentQuestions,
    getRecentQuestionById,
    deleteRecentQuestionById,
};