const voterSeeds = [
    {
        name: "عبدالرحمن عرفات المغاوري",
        has_voted: true,
        national_id: "30410011202835",
        email: "abnra3838@gmail.com",
        student_id: "STD-0001",
        status: "approved",
        is_verified: true,
        verification_method: "otp",
        failed_login_attempts: 0,
        notes: "",
        security_flags: []
    },
    {
        name: "محمد بليغ البراهيم الخطابي",
        has_voted: false,
        national_id: "30303291202176",
        email: "voteegy+std0002@gmail.com",
        student_id: "STD-0002",
        status: "approved",
        is_verified: false,
        verification_method: "otp",
        failed_login_attempts: 0,
        notes: "",
        security_flags: []
    },
    {
        name: "يوسف عبدالباسط ابراهيم ابراهيم",
        has_voted: false,
        national_id: "30305071200299",
        email: "voteegy+std0003@gmail.com",
        student_id: "STD-0003",
        status: "approved",
        is_verified: false,
        verification_method: "otp",
        failed_login_attempts: 0,
        notes: "",
        security_flags: []
    },
    {
        name: "محمد محمود ابراهيم غازي",
        has_voted: false,
        national_id: "30208011505915",
        email: "voteegy+std0004@gmail.com",
        student_id: "STD-0004",
        status: "approved",
        is_verified: false,
        verification_method: "otp",
        failed_login_attempts: 0,
        notes: "",
        security_flags: []
    }
];

const candidateSeeds = [
    {
        name: "محمد نجيب",
        age: 52,
        number_of_votes: 0,
        photo: "/images/candidates/mohamed-naguib.png",
        bio: "",
        manifesto: "",
        status: "approved"
    },
    {
        name: "جمال عبد الناصر",
        age: 38,
        number_of_votes: 0,
        photo: "/images/candidates/gamal-abdel-nasser.png",
        bio: "",
        manifesto: "",
        status: "approved"
    },
    {
        name: "أنور السادات",
        age: 52,
        number_of_votes: 0,
        photo: "/images/candidates/anwar-sadat.png",
        bio: "",
        manifesto: "",
        status: "approved"
    },
    {
        name: "محمد حسني مبارك",
        age: 52,
        number_of_votes: 0,
        photo: "/images/candidates/hosni-mubarak.png",
        bio: "",
        manifesto: "",
        status: "approved"
    },
    {
        name: "محمد مرسي",
        age: 60,
        number_of_votes: 0,
        photo: "/images/candidates/mohamed-morsi.png",
        bio: "",
        manifesto: "",
        status: "approved"
    },
    {
        name: "عدلي منصور",
        age: 68,
        number_of_votes: 0,
        photo: "/images/candidates/adly-mansour.png",
        bio: "",
        manifesto: "",
        status: "approved"
    },
    {
        name: "عبد الفتاح السيسي",
        age: 59,
        number_of_votes: 1,
        photo: "/images/candidates/abdel-fattah-el-sisi.png",
        bio: "sdjsjdf",
        manifesto: "mndffjmdsd",
        status: "approved"
    }
];

module.exports = {
    voterSeeds,
    candidateSeeds
};
