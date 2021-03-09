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