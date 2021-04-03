import { admin } from "../services/firebase";
import { merge } from "lodash";

export const listAllUsers = async (nextPageToken) => {
  // List batch of users, 1000 at a time.
  let users = []
  const lists = await admin.auth().listUsers(1000)
  users = lists.users

  if (lists && lists.pageToken) {
    let noToken = false
    let pageToken = lists.pageToken
    while (noToken !== true) {
      let newLists = await admin.auth().listUsers(1000, pageToken)
      users = merge(users, newLists.users)
      if (newLists && !newLists.pageToken) {
        noToken = true
      } else {
        pageToken = newLists.pageToken
      }
    }
  }

  return users
};


export const updateUserAccess = async (uid, userType, plan) => {
  let userTypes = ["basic", "pro"],
        newUserType = userType.trim().toLowerCase(),
        date = new Date(),
        planPeriod,
        expiry;

    if(userTypes.indexOf(newUserType) === -1) {
      return {
        success: false,
        error: "Invalid access type!",
      };
    }

    let userRecord = await admin.auth().getUser(uid);
    
    if(newUserType === "pro") {
      planPeriod = plan.trim().toLowerCase();

      if (planPeriod === "monthly") {
        expiry = new Date(date.setMonth(date.getMonth() + 1));
      } else if (planPeriod === "annually"){
        expiry = new Date(date.setFullYear(date.getFullYear() + 1));
      } else {
        return {
          success: false,
          error: "Invalid plan type!",
        };
      }
      
      if(userRecord.customClaims) {
        await admin.auth().setCustomUserClaims(uid, Object.assign(userRecord.customClaims, { user_type: newUserType, plan: planPeriod, expiry: expiry }));
      } else {
        await admin.auth().setCustomUserClaims(uid, { user_type: newUserType, plan: planPeriod, expiry: expiry });
      }
    } else {
      if(userRecord.customClaims) {
        await admin.auth().setCustomUserClaims(uid, Object.assign(userRecord.customClaims,{ user_type: newUserType, plan: "none", expiry: "none" }));
      } else {
        await admin.auth().setCustomUserClaims(uid, { user_type: newUserType, plan: "none", expiry: "none" });
      }
    }

    userRecord = await admin.auth().getUser(uid);
    console.log(userRecord);
    return {
      success: true,
      userRecord,
    };
};