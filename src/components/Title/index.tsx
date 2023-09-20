import { memo } from 'react';

interface Props {
  title: string;
}

const Title = (props: Props) => {
  const { title } = props;
  return <>{title}</>;
};

export default memo(Title);
