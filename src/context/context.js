import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [repos, setRepos] = useState(mockRepos)
  const [followers, setFollowers] = useState(mockFollowers)
  const [requests, setRequests] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({ show: false, msg: '' })

  const searchGithubUser = async user => {
    toggleError()
    setIsLoading(true)
    const { data } = await axios(`${rootUrl}/users/${user}`).catch(console.log)

    if (data) {
      setGithubUser(data)
      const { login, followers_url } = data

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`)
      ])
        .then(([repos, followers]) => {
          const STATUS = 'fulfilled'

          if (repos.status === STATUS) setRepos(repos.value.data)
          if (followers.status === STATUS) setFollowers(followers.value.data)
        })
        .catch(console.log)
    } else {
      toggleError(true, 'that username does not exist')
    }

    checkRequests()
    setIsLoading(false)
  }

  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        const {
          rate: { remaining }
        } = data
        setRequests(remaining)

        if (remaining === 0) {
          toggleError(true, 'sorry, you have exceeded your hourly rate limit!')
        }
      })
      .catch(console.log)
  }

  const toggleError = (show = false, msg = '') => setError({ show, msg })

  useEffect(checkRequests, [])

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

export { GithubProvider, GithubContext }
