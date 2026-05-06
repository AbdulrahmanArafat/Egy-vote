const { body, validationResult } = require("express-validator");

/**
 * Runs validation and responds with 422 if any errors exist.
 */
function handleValidationErrors(request, response, next) {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(422).json({
            message: errors.array()[0].msg
        });
    }
    return next();
}

/**
 * Validation rules for creating/updating a candidate.
 */
const validateCandidate = [
    body("name")
        .trim()
        .notEmpty().withMessage("اسم المرشح مطلوب.")
        .isLength({ max: 100 }).withMessage("اسم المرشح يجب أن يكون أقل من 100 حرف."),
    body("age")
        .isInt({ min: 18, max: 120 }).withMessage("العمر يجب أن يكون بين 18 و 120."),
    body("bio")
        .optional()
        .isLength({ max: 1000 }).withMessage("السيرة الذاتية يجب أن تكون أقل من 1000 حرف."),
    body("manifesto")
        .optional()
        .isLength({ max: 2000 }).withMessage("البرنامج الانتخابي يجب أن يكون أقل من 2000 حرف."),
    handleValidationErrors
];

/**
 * Validation rules for creating/updating a voter.
 */
const validateVoter = [
    body("name")
        .trim()
        .notEmpty().withMessage("اسم الناخب مطلوب.")
        .isLength({ max: 100 }).withMessage("الاسم يجب أن يكون أقل من 100 حرف."),
    body("national_id")
        .trim()
        .matches(/^\d{14}$/).withMessage("الرقم القومي يجب أن يكون 14 رقمًا بالضبط."),
    body("email")
        .trim()
        .isEmail().withMessage("البريد الإلكتروني غير صحيح.")
        .normalizeEmail(),
    body("student_id")
        .optional()
        .isLength({ max: 50 }).withMessage("رقم الطالب يجب أن يكون أقل من 50 حرفًا."),
    handleValidationErrors
];

module.exports = { validateCandidate, validateVoter };
