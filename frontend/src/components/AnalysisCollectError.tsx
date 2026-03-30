import { Link } from 'react-router-dom'

type Props = {
  message: string
}

export function AnalysisCollectError({ message }: Props) {
  return (
    <div className="analysis-error" role="alert">
      <div className="analysis-error__inner">
        <h1 className="analysis-error__title">Collection did not complete</h1>
        <p className="analysis-error__text">{message}</p>
        <ul className="analysis-error__list">
          <li>
            Set <code className="analysis-error__code">APIFY_API_TOKEN</code> in{' '}
            <code className="analysis-error__code">backend/.env</code> and restart Django.
          </li>
          <li>Ensure the Vite dev server proxies <code className="analysis-error__code">/api</code> to your backend.</li>
          <li>
            For UI-only demos without Apify, set{' '}
            <code className="analysis-error__code">VITE_USE_DUMMY_DATA=true</code> in frontend env.
          </li>
        </ul>
        <Link to="/" className="analysis-error__btn">
          Back to handles
        </Link>
      </div>
    </div>
  )
}
