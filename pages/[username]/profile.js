import { HeaderAndBottomAdder } from "../../components/HeaderAndBottomAdder";
import { ProfileUserData } from "../../components/ProfileUserData";
import { Post } from "../../components/Post";
import { CircularProgress, Grid, Typography } from "@mui/material";

import { auth, db } from "../../firebase";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	where,
} from "firebase/firestore";
import { useRecoilValue } from "recoil";
import { userdata } from "../../atoms/userAtom";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function UserProfilePage({ uploadsArray, requestedUserData }) {
	const loggedInUserData = useRecoilValue(userdata);
	const loggedInUserID = loggedInUserData?.uid;
	const router = useRouter();
	useEffect(() => {
		if (!loggedInUserID) router.push("/");
	}, []);

	if (!uploadsArray)
		return (
			<Grid
				container
				direction="column"
				alignItems="center"
				justifyContent="center"
				sx={{ width: "100vw", height: "100vh" }}
			>
				<CircularProgress />
				<Typography
					fontSize="small"
					variant="overline"
					sx={{ marginTop: "1rem" }}
				>
					Signing You In
				</Typography>
			</Grid>
		);

	return (
		<HeaderAndBottomAdder>
			{uploadsArray ? (
				<>
					<Grid container direction="column">
						<ProfileUserData
							requestedUserData={requestedUserData}
						/>
						{uploadsArray.map((post, index) => {
							return <Post key={index} post={post} />;
						})}
					</Grid>
				</>
			) : (
				<Grid
					container
					direction="column"
					alignItems="center"
					justifyContent="center"
					sx={{ width: "100vw", height: "100vh" }}
				>
					<CircularProgress />
					<Typography
						fontSize="small"
						variant="overline"
						sx={{ marginTop: "1rem" }}
					>
						Signing You In
					</Typography>
				</Grid>
			)}
		</HeaderAndBottomAdder>
	);
}

export async function getServerSideProps(context) {
	const { req, params } = context;
	const { headers } = req;
	const { referer } = headers;
	const { username } = params;

	let uploadsArray = [];
	const usersCollectionReference = collection(db, "users");
	const usernameQuery = query(
		usersCollectionReference,
		where("username", "==", username)
	);
	const querySnapshot = await getDocs(usernameQuery);
	const currentUserData = querySnapshot.docs[0].data();

	// const currentUserID = currentUserData.uid;
	// const loggedInUserID = auth.currentUser?.uid;
	// if (currentUserID !== loggedInUserID)
	// 	return {
	// 		redirect: {
	// 			destination: "/permissions",
	// 			permanent: false,
	// 		},
	// 	};

	const postIDs = currentUserData.uploads;

	for (const postID of postIDs) {
		const postReference = doc(db, `posts/${postID}`);
		const snapshot = await getDoc(postReference);
		const postData = snapshot.data();
		uploadsArray.sort((a, b) => b.time - a.time);
		postData.time = postData.time.toJSON();
		postData.postID = postID;

		let comments = [];
		const postCommentsCollection = collection(
			db,
			`/posts/${postID}/comments`
		);
		const commentsQueryConstraint = orderBy("commentTime");
		const commentsQuery = query(
			postCommentsCollection,
			commentsQueryConstraint
		);
		const allCommentsSnapshot = await getDocs(commentsQuery);
		const arrayOfComments = allCommentsSnapshot.docs;
		for (const commentDocument of arrayOfComments) {
			const commentDocumentID = commentDocument.id;
			const commentDocumentReference = commentDocument.ref;
			const commentSnapshot = await getDoc(commentDocumentReference);
			const commentData = commentSnapshot.data();
			commentData.commentID = commentDocumentID;
			commentData.commentTime = commentData.commentTime.toJSON();
			comments.push(commentData);
		}
		postData.comments = comments;

		uploadsArray.push(postData);
	}

	return { props: { uploadsArray, requestedUserData: currentUserData } };
}
