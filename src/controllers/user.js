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


export const updateUserAccess = async (uid, access, plan) => {
  let accessType = ["basic", "pro"],
        newAccess = access.trim().toLowerCase(),
        date = new Date(),
        planPeriod,
        expiry;

    if(accessType.indexOf(newAccess) === -1) {
      return {
        success: false,
        error: "Invalid access type!",
      };
    }

    if(newAccess === "pro") {
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

      await admin.auth().setCustomUserClaims(uid, { access: newAccess, plan: planPeriod, expiry: expiry });
    } else {
      await admin.auth().setCustomUserClaims(uid, { access: newAccess, plan: "none", expiry: "none" });
    }

    
    const userRecord = await admin.auth().getUser(uid);

    console.log(userRecord);

    return {
      success: true,
      userRecord,
    };
};