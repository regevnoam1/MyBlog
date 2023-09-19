import {List} from '@mui/material';
import FloatingMenu from '../components/FloatingMenu';
import TagsCloud from '../components/TagsCloud';
import Post from '../components/Post';
import {useState, useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import Tag from "../components/Tag";
import tag from "../components/Tag";


function Home({
                  Posts,
                  Tags,
                  tagsList,
                  handleAddNewTag,
                  selectedTagId,
                  selectedPopularityQuery,
                  userId,handleAddTagToPost,changeUserClappedOnPost,appTagClick
              }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [anchorEl, setAnchorEl] = useState(null);
    const [curPost, setCurPost] = useState('');
    ///////////////////////////////////// handle query param /////////////////////////////////////
    searchParams.get('popularity');
    useEffect(() => {
        if (selectedPopularityQuery !== '') {
            setSearchParams({popularity: `${selectedPopularityQuery}`});
        }
    }, [selectedPopularityQuery, setSearchParams]);

    ///////////////////////////////////// handle tag click /////////////////////////////////////
    const handleAddTagClick = (event, selectedPostId) => {
        setAnchorEl(event.currentTarget);
        setCurPost(selectedPostId);
    };

    const handleMenuClose = (selectedOption) => {
        setAnchorEl(null);
        handleAddTagToPost(curPost, selectedOption); // Call the prop function with curPost and selectedOption
    };

    const handleTagClick = (tagName, tagId) => {
        setSearchParams({ tag: tagName });
        appTagClick(tagName, tagId);
    };
    const handleUserClappedOnPost = (postId,userId,didUserClappedOnPost) => {
        changeUserClappedOnPost(postId,userId,didUserClappedOnPost);
    }
    ///////////////////////////////////// render components /////////////////////////////////////
    return (
        <div className='container'>
            <List sx={{width: '650px'}}>
                {Posts.map((post) => (
                    <Post
                        postId={post.id}
                        postTitle={post.title}
                        postContent={post.content}
                        postPopularity={post.popularity}
                        Tags={Tags}
                        handleAddTagClick={handleAddTagClick}
                        userId={userId}
                        handleTagClick={handleTagClick}
                        selectedTagId={selectedTagId}
                        handleUserClappedOnPost={handleUserClappedOnPost}
                    />
                ))}
            </List>
            <TagsCloud
                tagsList={tagsList}
                handleAddNewTag={handleAddNewTag}
                selectedTagId={selectedTagId}
                handleTagClick={handleTagClick}
            />
            <FloatingMenu
                menuOptions={tagsList}
                anchorElement={anchorEl}
                handleMenuClose={handleMenuClose}
            />
        </div>
    );
}

export default Home;
