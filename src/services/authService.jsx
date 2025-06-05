import { auth, db } from "../models/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signOut,
  getAuth,
  updatePassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

// Register & Save Profile
export const registerUser = async ({ email, password, displayName }) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    // Simpan ke Firestore
    await setDoc(doc(db, "users", res.user.uid), {
      email: res.user.email,
      displayName: displayName,
      createdAt: new Date()
    });

    return { success: true, user: res.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login 
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUserProfile = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (currentUser) {
    return {
      displayName: currentUser.displayName,
      email: currentUser.email,
    };
  }
  return null;
};
// Get Current User Profile
// export const getCurrentUserProfile = async () => {
//   const user = auth.currentUser;
//   if (!user) return null;

//   const userDoc = await getDoc(doc(db, "users", user.uid));
//   return userDoc.exists() ? userDoc.data() : null;
// };

// Update Profile
export const updateUserProfile = async ({ displayName }) => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "No user logged in" };

    // Update Firebase Auth
    await updateProfile(user, { displayName });

    // Update Firestore
    await updateDoc(doc(db, "users", user.uid), { displayName });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const changeUserPassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User tidak ditemukan.");
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete Account
export const deleteAccount = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "No user logged in" };

    // Hapus dari Firestore dulu
    await deleteDoc(doc(db, "users", user.uid));
    // Hapus akun dari Firebase Auth
    await deleteUser(user);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

//logout
export const logout = async () => { 
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};