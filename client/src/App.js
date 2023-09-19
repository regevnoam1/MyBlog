import axios from 'axios';
import './App.css';
import Home from './pages/Home';
import AddNewPost from './pages/AddNewPost';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {useState, useEffect, useCallback} from 'react';
import {
    Typography,
    AppBar,
    Toolbar,
    Button,
    ButtonGroup,
    Alert,
    Snackbar,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import HomeIcon from '@mui/icons-material/Home';
import FloatingMenu from './components/FloatingMenu';
import {Posts} from "server/model/Posts";

function App() {
    const baseURL = 'http://localhost:3080';
    const popularityOptions = [1, 5, 20, 100];

    const [userId, setUserId] = useState('');

    const [selectedPopularityQuery, setSelectedPopularityQuery] = useState('');
    const [selectedTagQuery, setSelectedTagQuery] = useState('');

    const [allPosts, setAllPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);

    const [tags, setTags] = useState({});
    const [tagsList, setTagsList] = useState([]);
    const [selectedTagId, setSelectedTagId] = useState('');

    const [anchorEl, setAnchorEl] = useState(null);

    const [alertMsg, setAlertMsg] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('');

    useEffect(() => {
        if (showAlert) {
            setTimeout(() => {
                handleAlert('', false, '');
            }, 1500);
        }
    }, [showAlert]);
    const handleAlert = (message, isShow, type) => {
        setAlertMsg(message);
        setShowAlert(isShow);
        setAlertType(type);
    };

    ///////////////////////////////////// data request /////////////////////////////////////
    axios.defaults.withCredentials = true;
    ///////////////////// get request /////////////////////

    // sets a userId cookie
    const getUser = useCallback(() => {
        axios
            .get(`${baseURL}/user`)
            .then((response) => {
                setUserId(response.data.id);
            })
            .catch((error) => {
                handleAlert(error.message, true, 'error');
            });
    }, []);

    const getPosts = useCallback(() => {
        axios
            .get(`${baseURL}/posts`)
            .then((response) => {
                setAllPosts([...response.data['Posts']]);
                setFilteredPosts([...response.data['Posts']]);
            })
            .catch((error) => {
                handleAlert(error.message, true, 'error');
            });
    }, []);

    const getFilteredPosts = (popularity, tag) => {
        let url = '';
        if (tag !== '') {
            url += `tag=${tag}`;
        }
        if (popularity !== '') {
            if (url !== '') {
                url += `&`;
            }
            url += `popularity=${popularity}`;
        }
        axios
            .get(`${baseURL}/posts?${url}`)
            .then((response) => {
                setFilteredPosts([...response.data['Posts']]);
            })
            .catch((error) => {
                handleAlert(error.message, true, 'error');
            });
    };

    const getTags = useCallback(() => {
        axios
            .get(`${baseURL}/tags`)
            .then((response) => {
                setTags({...response.data['Tags']});
                const tagsList = [];
                for (const tagName in response.data['Tags']) {
                    tagsList.push(tagName);
                }
                setTagsList(tagsList);
            })
            .catch((error) => {
                handleAlert(error.message, true, 'error');
            });
    }, []);

    useEffect(() => {
        getPosts();
        getTags();
        getUser();
    }, [getPosts, getTags, getUser]);

    ///////////////////// post request /////////////////////
    const addPost = (id, title, content,tag) => {
        axios
            .post(
                `${baseURL}/add-new-post`,
                {
                    post: {
                        id,
                        title,
                        content,
                        tag,
                    },
                },
                {
                    headers: {
                        // to send a request with a body as json you need to use this 'content-type'
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                }
            )
            .then((response) => {
                const lastPost = Posts[Posts.length - 1];
                addTagToPost(response.data.Posts[lastPost], tag);
                getPosts()
                getTags()
            });
    };

    const addNewTag = (tagName) => {
        axios
            .post(`${baseURL}/tags/tagName/${tagName}`)
            .then((response) => {
                setTags({...response.data['Tags']});
                const tagsList = [];
                for (const tagName in response.data['Tags']) {
                    tagsList.push(tagName);
                }
                setTagsList(tagsList);
                handleAlert('Tag was added successfully', true, 'success');
            })
            .catch((error) => {
                handleAlert(error.message, true, 'error');
            });
    };
    //ADD THE TAG BUTTON TO POST AND RENDER AT THE END.
    const addTagToPost = (curPost, selectedOption) => {
        axios.post(`${baseURL}/addTag`, {tagToADD: {curPost, selectedOption}},
            {
                headers: {
                    // to send a request with a body as json you need to use this 'content-type'
                    'content-type': 'application/x-www-form-urlencoded',
                },
            }
        )
            .then((response) => {
                getTags();
            }).catch((error) => {
            console.log("Nothing was pressed!")
        });
    }

    //CHANGE THE USER CLAPPED ON POST.
    const changeUserClappedOnPost = (postId, userId,didUserClappedOnPost) => {
        axios.post(`${baseURL}/clap`, {user: {postId, userId,didUserClappedOnPost}},
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            }
        )
            .then((response) => {
                setAllPosts([...response.data['Posts']]);
                getPosts();
            }).catch((error) => {
            alert("More than 5 claps are not allowed!")
        });
    }
    const filteredPostsByUserClapped = () => {
        axios
            .post(`${baseURL}/clapFilter`, {user: {userId}},{
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .then((response) => {
                setFilteredPosts([...response.data['Posts']]);
            })
            .catch((error) => {
                handleAlert(error.message, true, 'error');
            });
    }
    ///////////////////////////////////// handle click events /////////////////////////////////////
    const handlePopularityClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (selectedOption) => {
        setAnchorEl(null);
        filterPostsByPopularity(selectedOption);
    };

    const handleHomeClick = () => {
        setFilteredPosts(allPosts);
        setSelectedPopularityQuery('');
        setSelectedTagId('');
    };
    const handleMyClapsClick = () => {
        filteredPostsByUserClapped();
    }
    const appTagClick = (tagName, tagId) => {
        setSelectedTagId(tagName);
        filterPostsByTag(tagName, tagId)
    };

    ///////////////////////////////////// filters /////////////////////////////////////
    const filterPostsByPopularity = (minClapsNum) => {
        setSelectedPopularityQuery(`${minClapsNum}`);
        console.log(minClapsNum, selectedTagQuery)
        getFilteredPosts(minClapsNum, selectedTagQuery);
    };
    const filterPostsByTag = (tagName, tagId) => {
        setSelectedTagQuery(`${tagName}`);
        console.log(selectedPopularityQuery,tagName)
        getFilteredPosts(selectedPopularityQuery, tagName);
    }
    ///////////////////////////////////// render components /////////////////////////////////////
    const renderToolBar = () => {
        return (
            <AppBar position='sticky' color='inherit'>
                <Toolbar>
                    <ButtonGroup variant='text' aria-label='text button group'>
                        <Button
                            href='/'
                            size='large'
                            onClick={handleHomeClick}
                            startIcon={<HomeIcon/>}
                        >
                            Home
                        </Button>
                        <Button
                            href='/add-new-post'
                            size='large'
                            startIcon={<AddCircleIcon/>}
                        >
                            Add A New Post
                        </Button>
                    </ButtonGroup>
                    <Typography variant='h6' component='div' sx={{flexGrow: 1}} color='blue'>
                        Noam's Blog
                    </Typography>
                    <ButtonGroup variant='text' aria-label='text button group'>
                        <Button
                            size='large'
                            startIcon={<FilterAltIcon/>}
                            onClick={(e) => handlePopularityClick(e)}
                            data-testid='popularityBtn'
                            className={
                                window.location.href !== 'http://localhost:3000/add-new-post'
                                    ? ''
                                    : 'visibilityHidden'
                            }
                        >
                            filter by Popularity
                        </Button>
                    {userId && ( // Only show the "My Claps" button if there is a logged-in user
                        <Button
                            size='large'
                            // startIcon={My clasp}
                            onClick={handleMyClapsClick}
                            data-testid='myClapsBtn'
                            className={
                                window.location.href !== 'http://localhost:3000/add-new-post'
                                    ? ''
                                    : 'visibilityHidden'
                            }
                        >
                            My Claps
                        </Button>)}
                    </ButtonGroup>
                    <FloatingMenu
                        menuOptions={popularityOptions}
                        anchorElement={anchorEl}
                        handleMenuClose={handleMenuClose}
                    />
                </Toolbar>
            </AppBar>
        );
    };

    return (
        <div className='App'>
            {renderToolBar()}
            {showAlert && (
                <Snackbar open={true} data-testid='alert-snackbar'>
                    <Alert severity={alertType} data-testid='alert'>
                        {alertMsg}
                    </Alert>
                </Snackbar>
            )}
            <Router>
                <Routes>
                    <Route
                        path='/add-new-post'
                        element={<AddNewPost handleAddPost={addPost}/>}
                    />
                    <Route
                        path='/'
                        element={
                            <Home
                                Posts={filteredPosts}
                                Tags={tags}
                                tagsList={tagsList}
                                handleAddNewTag={addNewTag}
                                selectedTagId={selectedTagId}
                                selectedPopularityQuery={selectedPopularityQuery}
                                userId={userId}
                                handleAddTagToPost={addTagToPost}
                                changeUserClappedOnPost={changeUserClappedOnPost}
                                appTagClick={appTagClick}
                            />
                        }
                    />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
