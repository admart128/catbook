import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { setMeows } from '../meowActions';

import axios from 'axios';

import Meow from './Meow';

const MeowFeed = ({ isSelectingGif, setIsSelectingGif, filterCriteria, profileUsername, profileUserId, username, userId }) => {
  

  const dispatch = useDispatch();

  const location = useLocation();

  const prevMeowsRef = useRef();

  const meows = useSelector((state) => state.meow.meows);
  const following = useSelector((state) => state.user.following);

  const [noMeows, setNoMeows] = useState(false);

  const searchParams = new URLSearchParams(location.search);

  const query = searchParams.get('q');

  let [dummyValue, setDummyValue] = useState(0);

  useEffect(() => {
    setNoMeows(false);
  }, [setNoMeows]);

  useEffect(() => {
    prevMeowsRef.current = meows;
  }, [meows]);

  useEffect(() => {
    forceRerender();
  }, []);

  useEffect(() => {
    fetchMeows();
  }, [dispatch, query, meows]);

  const filterMeow = (meow) => {
    switch (filterCriteria) {
      case 'All':
        return !meow.isAReply && !meow.isAPlaceholder;
      case 'Following':
        return following?.includes(meow?.author._id) && !meow?.isAPlaceholder;
      case 'Meows':
        return meow.author.username === profileUsername && !meow.isAReply && !meow.isAPlaceholder;
      case 'Replies':
        return meow.author.username === profileUsername && meow.isAReply && !meow.isAPlaceholder;
      case 'Media':
        return meow.author.username === profileUsername &&
               (meow.meowMedia || meow.gifUrl) &&
               !meow.isAReply && !meow.isAPlaceholder;
      case 'Likes':
        return meow?.likedBy.includes(profileUserId) && !meow.isAPlaceholder;
      case 'Search':
        return !meow.isAPlaceholder;
      default:
        return false;
    }
  };
  
  const filteredMeows = meows.filter(filterMeow);

  const forceRerender = () => {
    setDummyValue((prevDummyValue) => prevDummyValue + 1);
  };

  const fetchMeows = async () => {
    let url = `${process.env.REACT_APP_BACKEND_URL}/meows/`;
    if (query) {
      url = `${process.env.REACT_APP_BACKEND_URL}/search?q=${query}`;
    }
    try {
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.message) {
        if (response.data.message === 'No Meows matching search found') {
          setNoMeows(true);
          return;
        }
        dispatch(setMeows([]));
        return;
      }
      const sortedMeows = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const areMeowsDifferent =
        !prevMeowsRef.current ||
        sortedMeows?.length !== prevMeowsRef?.current?.length ||
        !sortedMeows.every((meow, index) => meow._id === prevMeowsRef.current[index]._id);
      if (areMeowsDifferent) {
        dispatch(setMeows(sortedMeows));
        setNoMeows(false);
      }
    } catch (error) {
      console.error('Error fetching meows:', error);
    }
  };


  const meowFeedMessage = () => {
    switch (filterCriteria) {
      case 'All':
        return '⏳ Loading...';
      case 'Following':
        return '😿 No meows from cats you are following.';
      case 'Meows':
        if (profileUsername === username) {
          return '😿 You have not posted any meows.';
        } else return `😿 ${profileUsername} has not posted any meows.`;
      case 'Replies':
        if (profileUsername === username) {
          return '🗨 You have not replied to any meows.';
        } else return `🗨 ${profileUsername} has not replied to any meows.`;
      case 'Media':
        if (profileUsername === username) {
          return '🖼 You have not posted any meows with media.';
        } else return `🖼 ${profileUsername} has not posted any meows with media.`;
      case 'Likes':
        if (profileUsername === username) {
          return '💔 You have not liked any meows.';
        } else return `💔 ${profileUsername} has not liked any meows.`;
      case 'Search':
        return '⏳ Loading...';
      default:
        return '⏳ Loading...';
    }
  };

  return (
    <div className="">
      {noMeows ? (
        <div className="p-5 sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
          <p className="break-all">💨🍃😿 No results for "{query}".</p>
          <br></br>
          <p>😺🔎🐾 Try searching for something else.</p>
        </div>
      ) : filteredMeows.length === 0 ? (
        <div className="p-5 sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
          <p>{meowFeedMessage()}</p>
        </div>
      ) : (
        filteredMeows.map((meow) => (
          <div>
            <Meow
              key={meow._id}
              meow={meow}
              isSelectingGif={isSelectingGif}
              setIsSelectingGif={setIsSelectingGif}
            />
            <hr className="border-b-4 border-slate-200 " />
          </div>
        ))
      )}
    </div>
  );
};

export default MeowFeed;
