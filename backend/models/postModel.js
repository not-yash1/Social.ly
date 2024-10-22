import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    image: {
        public_id: {
            type: String,
            default: ''
        },
        url: {
            type: String,
            default: ''
        }
    },
    caption: {
        type: String,
        default: ''
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User_Soc'
        }
    ],
    comments: [
        {
            comment: {
                type: String
            },
            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User_Soc',
                required: true
            },
        }
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User_Soc',
        required: true
    },
    mentions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User_Soc'
        }
    ],
    shared: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User_Soc'
        }
    ],
    saved: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User_Soc'
        }
    ],
    updateHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'History'
        }
    ],
    location: {
        type: String
    }
},{
    timeStamps: true,
});


const Post = mongoose.model('Post', postSchema);
export default Post