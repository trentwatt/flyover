export default function TextGraph({ node, data, setNode }) {
  return (
    <>
      <h1>{node}</h1>
      <h4 key="incoming">Incoming</h4>
      <ul key="incoming-list">
        {data &&
          Object.entries(data.incoming).map(([vertex, score]) => (
            <li
              key={vertex}
              onClick={() => setNode(vertex)}
            >{`${vertex}: ${score}`}</li>
          ))}
      </ul>
      <h4 key="outgoing">Outgoing</h4>
      <ul key="outgoing-list">
        {data &&
          Object.entries(data.outgoing).map(([vertex, score]) => (
            <li
              key={vertex}
              onClick={() => setNode(vertex)}
            >{`${vertex}: ${score}`}</li>
          ))}
      </ul>
    </>
  )
}
