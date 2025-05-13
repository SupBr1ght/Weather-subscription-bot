import  mongoose  from "mongoose";

const {Schema} = mongoose

const UserSubscription = new Schema({
    chatId: {type: Number, required: true},
    cronTime: {type: String, required: true},
    timeZone: { type: String, default: 'Europe/Kyiv' },
    latitude: {type: Number, required: true},
    longtitude: {type: Number, required: true},
    enabled: { type: Boolean, default: true, required: true }
})

// to make ability redefine models another words update
export const UserSubscriptionForecast = mongoose.models.Subscription
  || mongoose.model('Subscription', UserSubscription);
