import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps) {
  const [posts, setPosts] = useState(props.postsPagination.results);
  const [nextPage, setNextPage] = useState(props.postsPagination.next_page);

  function loadMorePosts() {
    if (!nextPage) {
      return;
    }

    console.log(nextPage);

    fetch(nextPage)
      .then(function(response) {
        return response.json();
      })
      .then(function(data){

        setPosts(oldState => [
          ...oldState,
          {
            uid: data.results[0].uid,
            first_publication_date: data.results[0].first_publication_date,
            data: {
              title: data.results[0].data.title,
              subtitle: data.results[0].data.subtitle,
              author: data.results[0].data.author,
            }
          }
        ]);

        setNextPage(data.next_page)
      })
  }

  return (
    <>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <footer>
                  <time>
                    <FiCalendar />
                    {
                      format(
                        new Date(post.first_publication_date),
                        'dd MMM u',
                        {locale: ptBR}
                      )
                    }
                  </time>
                  <span><FiUser /> {post.data.author}</span>
                </footer>
              </a>
            </Link>
          ))}

          { nextPage && <button onClick={loadMorePosts}>Carregar mais posts</button> }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const nextPage = postsResponse.next_page;

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results: posts,
      }
    }
  }
};
