import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useEffect } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url?: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  useEffect(() => {
    let script = document.createElement('script');
    let anchor = document.getElementById('utterances-comments');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin','anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'johnnycfg/desafio01-trilha-reactjs-space-traveling');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute( 'theme', 'github-dark');
    anchor.appendChild(script);
  }, []);

  const formattedPostContent = post.data.content.map(section => {
    const text = section.body.reduce((acc, cur) => {
      return acc = acc.concat(RichText.asHtml([cur]));
    }, '');

    return {
      heading: section.heading,
      body: text,
    }
  });

  const textLenght = formattedPostContent.reduce(function(acc, cur) {
    const wordsHeading = cur.heading.split(' ');
    const wordsBody = cur.body.split(' ');
    return acc + wordsHeading.length + wordsBody.length;
  }, 0)

  const readingDuration = Math.ceil(textLenght / 200);

  return (
    <>
      <main className={styles.container}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt='logo' />
        </div>
        <div className={styles.post}>
          <header>
            <strong>{post.data.title}</strong>

            <div className={styles.postData}>
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
              <span><FiClock /> {readingDuration} min</span>
            </div>
          </header>

          <article className={styles.postContent}>
            {formattedPostContent.map(section => {
              return (
                <section key={section.heading}>
                  <strong>{section.heading}</strong>
                  <div dangerouslySetInnerHTML={{__html: section.body}}/>
                </section>
              )
            })}
          </article>
        </div>

        <div id='utterances-comments'></div>
      </main>

    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],

  );

  const postsSlugArr = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    };
  });

  return {
    paths: postsSlugArr,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug} = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(section => {
        return {
          heading: section.heading,
          body: section.body.map(item => {
              return item;
          })
        }
      }),
    }
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60,
  }
};
