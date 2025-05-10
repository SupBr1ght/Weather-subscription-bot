import  mongoose  from "mongoose";

const {Schema} = mongoose

const UserSubscription = new Schema({
    chatId: {type: Number, required: true},
    cronTime: {type: String, required: true},
    timeZone: { type: String, default: 'Europe/Kyiv' },
    enabled: { type: Boolean, default: true, required: true }
})

export const UserSubscriptionForecast = mongoose.model('Subscription', UserSubscription);