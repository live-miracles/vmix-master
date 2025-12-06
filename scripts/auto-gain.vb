' Script name: AutoGain
' It monitors the input which has AutoGain in the name
' and automatically adjusts the gain to prevent clipping or low volume.
' You can configure the clip and peak treshhold values bellow.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain 0.0.2")

' Configuration
Dim loopTime = 50
Dim clipThreshold As Double = 0.9  ' 0.9 ~ -1dB | Decibels = 20 * Math.Log10(Amplitude)
Dim peakThreshold As Double = 0.45  ' 0.45 ~ -7dB
Dim voiceThreshold As Double = 0.1  ' 0.1 ~ -20dB
Dim peakWaitLimit As Integer = 5000
Dim gainUpTime As Integer = 3000
Dim gainDownTime As Integer = 2000

Dim now As Double = 0
Dim voicePeakTimestamp As Double = 0  ' When translator last reached peakThreshold
Dim voiceTimestamp As Double = 0  ' When translator last spoke above voiceThreshold
Dim gainDownTimestamp As Double = 0
Dim gainUpTimestamp As Double = 0

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(loopTime)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000,1,1)).TotalMilliseconds

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'AutoGain')]")
        If micNode Is Nothing Then
            Console.WriteLine(timestamp & " AutoGain | No inputs have 'AutoGain' in the name.")
            Sleep(5000)
            Continue Do
        End If

        Dim meterF1 As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim inputNumber As String = micNode.Attributes("number").Value
        Dim gainDb As Integer = CInt(micNode.Attributes("gainDb").Value)

        If meterF1 > clipThreshold And gainDownTimestamp < now Then
            ' Decrease gain to prevent clipping
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Max(gainDb - 1, 0)))
            gainDownTimestamp = now + gainDownTime
        End If

        If meterF1 > peakThreshold Then
            voicePeakTimestamp = now + peakWaitLimit
        End If

        If meterF1 > voiceThreshold Then
            voiceTimestamp = now + peakWaitLimit
        End If

        If voicePeakTimestamp < now And voiceTimestamp > now And gainUpTimestamp < now Then
            ' Increase gain if no peaks detected for gainUpTime and voice detected recently
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Min(gainDb + 1, 24)))
            gainUpTimestamp = now + gainUpTime
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop
