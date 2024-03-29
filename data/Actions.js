import { initializeApp } from "firebase/app";
import {
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  doc,
  getDocs,
  getFirestore,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseConfig } from "../Secrets";
import {
  LOAD_POSTS,
  ADD_POST,
  LOAD_USER_INFO,
  DELETE_POST,
  UPDATE_POST,
  RESOLVE_POST,
  SET_POST_COMMENTS,
} from "./Reducer";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
let commentSnapshotUnsub = undefined;

const addUser = (user) => {
  return async (dispatch) => {
    userToAdd = {
      email: user.email,
      key: user.uid,
    };
    await setDoc(doc(db, "users", user.uid), userToAdd);
  };
};

const loadUserInfo = (authUser) => {
  return async (dispatch) => {
    const userSnap = await getDoc(doc(db, "users", authUser.uid));
    const user = userSnap.data();
    dispatch({
      type: LOAD_USER_INFO,
      payload: { user: { key: authUser.uid, ...user } },
    });
  };
};

const updateUser = (user, updateInfo) => {
  const { displayName, contactEmail, contactPhone, profilePicUrl } = updateInfo;
  return async (dispatch) => {
    await updateDoc(doc(db, "users", user.uid), {
      displayName,
      contactEmail,
      contactPhone,
      profilePicUrl,
    });
    dispatch({
      type: LOAD_USER_INFO,
      payload: {
        user: {
          displayName,
          contactEmail,
          contactPhone,
          profilePicUrl,
          email: contactEmail,
          key: user.uid,
        },
      },
    });
  };
};

const saveProfilePic = async (pictureObject) => {
  const fileName = pictureObject.uri.split("/").pop();
  const currentPhotoRef = ref(storage, `images/${fileName}`);

  try {
    const response = await fetch(pictureObject.uri);

    const imageBlob = await response.blob();

    await uploadBytes(currentPhotoRef, imageBlob);

    const downloadURL = await getDownloadURL(currentPhotoRef);

    return downloadURL;
  } catch (e) {
    console.log("Error saving picture:", e);
  }
};

const loadPosts = () => {
  return async (dispatch) => {
    let q = query(collection(db, "PostList"));
    onSnapshot(q, (querySnapshot) => {
      let newPosts = querySnapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        key: docSnap.id,
      }));

      dispatch({
        type: LOAD_POSTS,
        payload: {
          newPosts: newPosts.map((post) => ({
            ...post,
          })),
        },
      });
    });
  };
};

const addPost = async (
  breed,
  typeValue,
  location,
  reportTime,
  species,
  description,
  picList,
  author
) => {
  const docRef = await addDoc(collection(db, "PostList"), {
    breed: breed,
    species: species,
    description: description,
    postTime: reportTime,
    reportTime: reportTime,
    updateTime: reportTime,
    location: location,
    type: typeValue,
    resolved: false,
    author: author,
    pictures: picList,
  });
  const id = docRef.id;
  await updateDoc(doc(db, "PostList", id), { key: id });
};

const deletePost = (item) => {
  return async (dispatch) => {
    await deleteDoc(doc(db, "PostList", item.key));
    dispatch({
      type: DELETE_POST,
      payload: {
        key: item.key,
      },
    });
  };
};

const resolvePost = (item) => {
  return async (dispatch) => {
    await updateDoc(doc(db, "PostList", item.key), {
      resolved: true,
    });
    dispatch({
      type: RESOLVE_POST,
      payload: {
        key: item.key,
      },
    });
  };
};

const updatePost = (
  key,
  breed,
  typeValue,
  location,
  reportTime,
  species,
  description,
  picList
) => {
  return async (dispatch) => {
    await updateDoc(doc(db, "PostList", key), {
      breed: breed,
      species: species,
      description: description,
      postTime: reportTime,
      reportTime: reportTime,
      updateTime: reportTime,
      location: location,
      type: typeValue,
      pictures: picList,
    });
    dispatch({
      type: UPDATE_POST,
      payload: {
        key: key,
        breed: breed,
        species: species,
        description: description,
        postTime: reportTime,
        reportTime: reportTime,
        updateTime: reportTime,
        location: location,
        type: typeValue,
        pictures: picList,
      },
    });
  };
};

const getPostAuthorInfo = async (authorId) => {
  const userSnap = await getDoc(doc(db, "users", authorId));
  const user = userSnap.data();
  return user;
};

const setPostComments = (postId) => {
  return async (dispatch) => {
    if (commentSnapshotUnsub) {
      commentSnapshotUnsub();
      commentSnapshotUnsub = undefined;
    }
    const q = query(
      collection(db, "PostList", postId, "comments"),
      orderBy("timestamp", "desc")
    );

    commentSnapshotUnsub = onSnapshot(q, async (querySnapshot) => {
      const commentsPromises = querySnapshot.docs.map(async (docSnap) => {
        const commentData = docSnap.data();
        const userDoc = await getDoc(doc(db, "users", commentData.author));

        return {
          ...commentData,
          timestamp: commentData.timestamp.seconds,
          authorInfo: userDoc.data(),
        };
      });

      const commentsWithUser = await Promise.all(commentsPromises);

      dispatch({
        type: SET_POST_COMMENTS,
        payload: {
          postComments: commentsWithUser,
        },
      });
    });
  };
};

const unsubscribeFromPostComments = () => {
  if (commentSnapshotUnsub) {
    commentSnapshotUnsub();
    commentSnapshotUnsub = undefined;
  }
};

const addComment = async (postId, commentInfo) => {
  const commentsCollection = collection(db, "PostList", postId, "comments");
  await addDoc(commentsCollection, commentInfo); // no need to dispatch
};

export {
  addUser,
  updateUser,
  saveProfilePic,
  loadPosts,
  addPost,
  loadUserInfo,
  deletePost,
  resolvePost,
  updatePost,
  getPostAuthorInfo,
  setPostComments,
  unsubscribeFromPostComments,
  addComment,
};
